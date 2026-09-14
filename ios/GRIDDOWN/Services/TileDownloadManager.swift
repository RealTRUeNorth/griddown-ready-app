import Foundation
import Observation
import UIKit

/// Thread-safe work queue for the tile download pool.
private actor TileQueue {
    private var items: [(z: Int, x: Int, y: Int)]
    private var index = 0

    init(_ items: [(z: Int, x: Int, y: Int)]) {
        self.items = items
    }

    func next() -> (z: Int, x: Int, y: Int)? {
        guard index < items.count else { return nil }
        defer { index += 1 }
        return items[index]
    }
}

@Observable
@MainActor
final class TileDownloadManager {
    private let defaults = UserDefaults.standard
    private let packsKey = "griddown_map_packs"

    private(set) var packs: [MapPack] = []
    private(set) var activePackId: String?
    private(set) var tilesDone = 0
    private(set) var tilesTotal = 0
    private(set) var downloadedBytes: Int64 = 0
    private(set) var lastError: String?

    var isDownloading: Bool { activePackId != nil }

    private var currentTask: Task<Void, Never>?

    static var mapsDirectory: URL {
        URL.documentsDirectory.appendingPathComponent("maps", isDirectory: true)
    }

    init() {
        loadPacks()
    }

    // MARK: - Persistence

    private func loadPacks() {
        guard let raw = defaults.data(forKey: packsKey) else { return }
        let stored = raw.isEmpty ? nil : raw
        guard let data = stored,
              let decoded = try? JSONDecoder().decode([MapPack].self, from: data) else { return }
        // Drop packs whose tile directories have vanished from disk
        let fm = FileManager.default
        packs = decoded.filter { pack in
            let dir = Self.mapsDirectory.appendingPathComponent(pack.id, isDirectory: true)
            var isDir: ObjCBool = false
            return fm.fileExists(atPath: dir.path, isDirectory: &isDir) && isDir.boolValue
        }
    }

    private func savePacks() {
        guard let data = try? JSONEncoder().encode(packs) else { return }
        defaults.set(data, forKey: packsKey)
    }

    // MARK: - Estimation

    struct PackEstimate {
        let tileCount: Int
        let sizeBytes: Int64
        let bounds: TileMath.Bounds
    }

    func estimate(centerLat: Double, centerLon: Double, spanLat: Double, spanLon: Double) -> PackEstimate {
        let b = TileMath.bounds(centerLat: centerLat, centerLon: centerLon, spanLat: spanLat, spanLon: spanLon)
        let count = TileMath.tileCount(TileMath.tileRanges(b, zooms: TileMath.offlineZooms))
        return PackEstimate(tileCount: count, sizeBytes: Int64(count) * TileMath.avgTileBytes, bounds: b)
    }

    // MARK: - Download

    func downloadPack(name: String, centerLat: Double, centerLon: Double, spanLat: Double, spanLon: Double) {
        guard !isDownloading else { return }
        let est = estimate(centerLat: centerLat, centerLon: centerLon, spanLat: spanLat, spanLon: spanLon)
        guard est.tileCount > 0 else { return }
        guard est.tileCount <= TileMath.maxTilesPerPack else {
            lastError = "That area covers \(est.tileCount) tiles (~\(Self.bytesLabel(est.sizeBytes))). Zoom in and try again."
            return
        }

        let packId = "pack-\(Int(Date().timeIntervalSince1970 * 1000))"
        let dir = Self.mapsDirectory.appendingPathComponent(packId, isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        var tiles: [(z: Int, x: Int, y: Int)] = []
        for range in TileMath.tileRanges(est.bounds, zooms: TileMath.offlineZooms) {
            for x in range.xMin...range.xMax {
                for y in range.yMin...range.yMax {
                    tiles.append((range.z, x, y))
                }
            }
        }

        activePackId = packId
        tilesTotal = est.tileCount
        tilesDone = 0
        downloadedBytes = 0
        lastError = nil

        currentTask = Task { [weak self] in
            await self?.runDownload(packId: packId, name: name, dir: dir, bounds: est.bounds, tiles: tiles)
        }
    }

    func cancelDownload() {
        currentTask?.cancel()
    }

    func clearError() {
        lastError = nil
    }

    private func runDownload(packId: String, name: String, dir: URL, bounds: TileMath.Bounds, tiles: [(z: Int, x: Int, y: Int)]) async {
        let queue = TileQueue(tiles)
        var failed = false

        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<4 {
                group.addTask { [weak self] in
                    while let tile = await queue.next() {
                        if Task.isCancelled { return }
                        let added = await TileDownloadManager.fetchTile(tile.z, tile.x, tile.y, to: dir)
                        await self?.recordTileProgress(bytesAdded: added)
                    }
                }
            }
        }

        if Task.isCancelled {
            try? FileManager.default.removeItem(at: dir)
            activePackId = nil
            return
        }

        let fileCount = Self.countFiles(in: dir)
        guard fileCount > 0 else {
            try? FileManager.default.removeItem(at: dir)
            lastError = "Could not download map tiles. Check your connection."
            activePackId = nil
            return
        }
        if fileCount < tiles.count / 2 { failed = true }

        let pack = MapPack(
            id: packId,
            name: name,
            centerLat: (bounds.minLat + bounds.maxLat) / 2,
            centerLon: (bounds.minLon + bounds.maxLon) / 2,
            minLat: bounds.minLat,
            maxLat: bounds.maxLat,
            minLon: bounds.minLon,
            maxLon: bounds.maxLon,
            minZ: TileMath.offlineZooms.first ?? 12,
            maxZ: TileMath.offlineZooms.last ?? 15,
            tileCount: fileCount,
            sizeBytes: downloadedBytes,
            downloadedAt: ISO8601DateFormatter().string(from: Date())
        )
        packs.append(pack)
        savePacks()
        tilesDone = tilesTotal
        activePackId = nil
        if failed {
            lastError = "Some tiles could not be downloaded — the pack may have gaps. Re-download for full coverage."
        }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    private func recordTileProgress(bytesAdded: Int64) {
        tilesDone += 1
        downloadedBytes += bytesAdded
    }

    /// Fetches and stores one tile; returns the byte count written (0 on failure).
    nonisolated private static func fetchTile(_ z: Int, _ x: Int, _ y: Int, to dir: URL) async -> Int64 {
        guard let url = TileMath.tileURL(z, x, y) else { return 0 }
        var request = URLRequest(url: url)
        request.setValue("GRIDDOWN/1.0 (offline map pack)", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 20
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200, !data.isEmpty else { return 0 }
            let fileURL = dir.appendingPathComponent(TileMath.fileName(z, x, y))
            try data.write(to: fileURL, options: .atomic)
            return Int64(data.count)
        } catch {
            return 0
        }
    }

    nonisolated private static func countFiles(in dir: URL) -> Int {
        (try? FileManager.default.contentsOfDirectory(atPath: dir.path).count) ?? 0
    }

    // MARK: - Queries & Management

    func packCovering(lat: Double, lon: Double) -> MapPack? {
        packs.first { $0.covers(lat: lat, lon: lon) }
    }

    func tileDirectory(for packId: String) -> URL {
        Self.mapsDirectory.appendingPathComponent(packId, isDirectory: true)
    }

    func deletePack(_ pack: MapPack) {
        if activePackId == pack.id { cancelDownload() }
        try? FileManager.default.removeItem(at: tileDirectory(for: pack.id))
        packs.removeAll { $0.id == pack.id }
        savePacks()
    }

    static func bytesLabel(_ bytes: Int64) -> String {
        bytes.formatted(.byteCount(style: .memory))
    }
}
