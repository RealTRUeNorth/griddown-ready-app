import UIKit

/// Live battery level and charging state for the device status panel.
@MainActor
@Observable
final class BatteryService {
    /// Percent 0-100, or -1 when unknown (e.g. simulator).
    private(set) var level: Int = -1
    private(set) var isCharging = false

    private var observers: [NSObjectProtocol] = []

    func start() {
        let device = UIDevice.current
        device.isBatteryMonitoringEnabled = true
        refresh()
        let center = NotificationCenter.default
        observers.append(center.addObserver(
            forName: UIDevice.batteryLevelDidChangeNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.refresh() }
        })
        observers.append(center.addObserver(
            forName: UIDevice.batteryStateDidChangeNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.refresh() }
        })
    }

    func stop() {
        observers.forEach(NotificationCenter.default.removeObserver)
        observers.removeAll()
    }

    private func refresh() {
        let device = UIDevice.current
        level = device.batteryLevel >= 0 ? Int((device.batteryLevel * 100).rounded()) : -1
        isCharging = device.batteryState == .charging || device.batteryState == .full
    }
}
