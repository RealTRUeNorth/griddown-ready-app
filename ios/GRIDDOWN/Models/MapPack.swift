import Foundation

/// A downloaded offline map tile pack: standard web-mercator PNG tiles for a
/// bounded region, stored on-device and rendered when signal is gone.
nonisolated struct MapPack: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let centerLat: Double
    let centerLon: Double
    let minLat: Double
    let maxLat: Double
    let minLon: Double
    let maxLon: Double
    let minZ: Int
    let maxZ: Int
    let tileCount: Int
    var sizeBytes: Int64
    let downloadedAt: String

    /// True when the pack's bounds contain the given coordinate.
    func covers(lat: Double, lon: Double) -> Bool {
        lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon
    }
}
