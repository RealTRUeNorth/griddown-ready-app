import Foundation
import Observation
import UIKit

struct KiwixDownloadRecord: Codable, Sendable, Equatable {
    var resourceId: String
    var fileName: String
    var bytesTotal: Int64
    var downloadedAt: String
}

enum KiwixDownloadState: Equatable {
    case notStarted
    case downloading(progress: Double, written: Int64, total: Int64)
    case completed(record: KiwixDownloadRecord)
    case failed(String)
    case canceled
}

/// Manages real Kiwix ZIM downloads via URLSession download tasks with live
/// progress, cancellation, and on-disk verification. Completed records persist
/// across launches; files live in Documents/kiwix/.
@Observable
final class KiwixDownloadManager: NSObject {
    private(set) var records: [String: KiwixDownloadRecord] = [:]
    private(set) var progressById: [String: Double] = [:]
    private(set) var writtenById: [String: Int64] = [:]
    private(set) var totalById: [String: Int64] = [:]
    private(set) var errorById: [String: String] = [:]
    private(set) var canceledIds: Set<String> = []
    private(set) var activeIds: Set<String> = []

    private var tasks: [String: URLSessionDownloadTask] = [:]
    private var lastProgressPush: [String: Date] = [:]
    private let storageKey = "griddown_kiwix_downloads"

    @ObservationIgnored
    private lazy var session: URLSession = URLSession(
        configuration: .default,
        delegate: makeDelegate(),
        delegateQueue: nil
    )

    override init() {
        super.init()
        loadRecords()
    }

    // MARK: - Public API

    func state(for resource: KiwixResource) -> KiwixDownloadState {
        if let record = records[resource.id] {
            return .completed(record: record)
        }
        if activeIds.contains(resource.id) {
            return .downloading(
                progress: progressById[resource.id] ?? 0,
                written: writtenById[resource.id] ?? 0,
                total: totalById[resource.id] ?? (resource.sizeBytes ?? 0)
            )
        }
        if let error = errorById[resource.id] { return .failed(error) }
        if canceledIds.contains(resource.id) { return .canceled }
        return .notStarted
    }

    func start(_ resource: KiwixResource) {
        guard !activeIds.contains(resource.id), records[resource.id] == nil else { return }
        guard let url = URL(string: resource.downloadUrl) else { return }
        let fileName = Self.fileName(for: resource)
        errorById[resource.id] = nil
        canceledIds.remove(resource.id)
        progressById[resource.id] = 0
        writtenById[resource.id] = 0
        totalById[resource.id] = resource.sizeBytes ?? 0
        activeIds.insert(resource.id)
        let task = session.downloadTask(with: URLRequest(url: url))
        task.taskDescription = "\(resource.id)|\(fileName)"
        tasks[resource.id] = task
        task.resume()
    }

    func cancel(_ resourceId: String) {
        tasks[resourceId]?.cancel()
        tasks[resourceId] = nil
        activeIds.remove(resourceId)
        progressById[resourceId] = nil
        canceledIds.insert(resourceId)
    }

    func delete(_ resourceId: String) {
        if activeIds.contains(resourceId) { cancel(resourceId) }
        if let record = records[resourceId] {
            try? FileManager.default.removeItem(at: Self.fileURL(for: record.fileName))
            records[resourceId] = nil
            persist()
        }
        canceledIds.remove(resourceId)
        errorById[resourceId] = nil
    }

    func fileURL(for resourceId: String) -> URL? {
        guard let record = records[resourceId] else { return nil }
        return Self.fileURL(for: record.fileName)
    }

    var totalDownloadedBytes: Int64 {
        records.values.reduce(0) { $0 + $1.bytesTotal }
    }

    // MARK: - Paths & formatting

    static func fileURL(for fileName: String) -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("kiwix", isDirectory: true).appendingPathComponent(fileName)
    }

    static func fileName(for resource: KiwixResource) -> String {
        if let last = resource.downloadUrl.split(separator: "/").last, last.hasSuffix(".zim") {
            return String(last)
        }
        return "\(resource.id).zim"
    }

    static func formatBytes(_ bytes: Int64) -> String {
        if bytes <= 0 { return "0 MB" }
        let gb = Double(bytes) / (1024 * 1024 * 1024)
        if gb >= 1 { return String(format: "%.1f GB", gb) }
        let mb = Double(bytes) / (1024 * 1024)
        if mb >= 1 { return "\(Int(mb)) MB" }
        return "\(Int(Double(bytes) / 1024)) KB"
    }

    // MARK: - Persistence

    private func loadRecords() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([String: KiwixDownloadRecord].self, from: data) else { return }
        // Drop records whose file vanished from disk
        records = decoded.filter { _, record in
            FileManager.default.fileExists(atPath: Self.fileURL(for: record.fileName).path)
        }
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(records) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: - Delegate callbacks (hopped to MainActor via Task)

    private func makeDelegate() -> KiwixDownloadDelegate {
        KiwixDownloadDelegate(
            onProgress: { [weak self] id, written, total in
                Task { @MainActor in self?.handleProgress(id: id, written: written, total: total) }
            },
            onFinish: { [weak self] id, fileName in
                Task { @MainActor in self?.handleFinished(id: id, fileName: fileName) }
            },
            onFail: { [weak self] id, message in
                Task { @MainActor in self?.handleFailed(id: id, message: message) }
            },
            onCancel: { [weak self] id in
                Task { @MainActor in self?.handleCanceled(id: id) }
            }
        )
    }

    private func handleProgress(id: String, written: Int64, total: Int64) {
        guard activeIds.contains(id) else { return }
        let now = Date()
        if let last = lastProgressPush[id], now.timeIntervalSince(last) < 0.25, written < total { return }
        lastProgressPush[id] = now
        writtenById[id] = written
        if total > 0 {
            totalById[id] = total
            progressById[id] = Double(written) / Double(total)
        } else {
            // Server didn't report length — estimate against the catalog size
            let expected = totalById[id] ?? 0
            progressById[id] = expected > 0 ? min(Double(written) / Double(expected), 0.99) : 0
        }
    }

    private func handleFinished(id: String, fileName: String) {
        let url = Self.fileURL(for: fileName)
        let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.int64Value
            ?? totalById[id] ?? 0
        records[id] = KiwixDownloadRecord(
            resourceId: id,
            fileName: fileName,
            bytesTotal: size,
            downloadedAt: ISO8601DateFormatter().string(from: Date())
        )
        persist()
        activeIds.remove(id)
        tasks[id] = nil
        progressById[id] = 1
        writtenById[id] = size
        totalById[id] = size
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    private func handleFailed(id: String, message: String) {
        activeIds.remove(id)
        tasks[id] = nil
        errorById[id] = message
    }

    private func handleCanceled(id: String) {
        activeIds.remove(id)
        tasks[id] = nil
        canceledIds.insert(id)
    }
}

/// URLSession download delegate. The temp file must be moved synchronously
/// inside didFinishDownloadingTo before it is deleted by the system.
private final class KiwixDownloadDelegate: NSObject, URLSessionDownloadDelegate, @unchecked Sendable {
    let onProgress: @Sendable (String, Int64, Int64) -> Void
    let onFinish: @Sendable (String, String) -> Void
    let onFail: @Sendable (String, String) -> Void
    let onCancel: @Sendable (String) -> Void

    init(
        onProgress: @escaping @Sendable (String, Int64, Int64) -> Void,
        onFinish: @escaping @Sendable (String, String) -> Void,
        onFail: @escaping @Sendable (String, String) -> Void,
        onCancel: @escaping @Sendable (String) -> Void
    ) {
        self.onProgress = onProgress
        self.onFinish = onFinish
        self.onFail = onFail
        self.onCancel = onCancel
    }

    private nonisolated func splitDescription(_ task: URLSessionTask) -> (id: String, fileName: String) {
        let desc = task.taskDescription ?? ""
        let parts = desc.components(separatedBy: "|")
        return (parts.first ?? desc, parts.count > 1 ? parts[1] : "\(parts.first ?? "download").zim")
    }

    nonisolated func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        let (id, _) = splitDescription(downloadTask)
        guard !id.isEmpty else { return }
        onProgress(id, totalBytesWritten, totalBytesExpectedToWrite)
    }

    nonisolated func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        let (id, fileName) = splitDescription(downloadTask)
        guard !id.isEmpty else { return }
        let fm = FileManager.default
        guard let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first else {
            onFail(id, "Storage unavailable")
            return
        }
        let dir = docs.appendingPathComponent("kiwix", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        let dest = dir.appendingPathComponent(fileName)
        try? fm.removeItem(at: dest)
        do {
            try fm.moveItem(at: location, to: dest)
            onFinish(id, fileName)
        } catch {
            onFail(id, "Could not store downloaded file")
        }
    }

    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let error else { return }
        let (id, _) = splitDescription(task)
        guard !id.isEmpty else { return }
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
            onCancel(id)
        } else {
            onFail(id, error.localizedDescription)
        }
    }
}
