import Network
import Observation

/// Tracks connectivity so the UI can show a live ONLINE / OFFLINE indicator.
@MainActor
@Observable
final class NetworkMonitor {
    private(set) var isOnline = true

    private let monitor = NWPathMonitor()
    private var started = false

    func start() {
        guard !started else { return }
        started = true
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor [weak self] in
                self?.isOnline = online
            }
        }
        monitor.start(queue: DispatchQueue.global(qos: .utility))
    }
}
