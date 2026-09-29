import CoreMotion
import Observation

/// Today's step count and walking distance from the motion coprocessor,
/// shown in the device status panel. Degrades gracefully on devices without
/// a pedometer (e.g. simulator).
@MainActor
@Observable
final class PedometerService {
    private(set) var steps: Int = 0
    private(set) var meters: Double = 0
    private(set) var isAvailable = false

    private let pedometer = CMPedometer()
    private var isRunning = false

    func start() {
        guard !isRunning else { return }
        guard CMPedometer.isStepCountingAvailable() else { return }
        isAvailable = true
        isRunning = true
        let startOfDay = Calendar.current.startOfDay(for: Date())
        pedometer.queryPedometerData(from: startOfDay, to: Date()) { [weak self] data, _ in
            let steps = data?.numberOfSteps.intValue ?? 0
            let meters = data?.distance?.doubleValue ?? 0
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.steps = steps
                self.meters = meters
            }
        }
        pedometer.startUpdates(from: startOfDay) { [weak self] data, _ in
            guard let data else { return }
            let steps = data.numberOfSteps.intValue
            let meters = data.distance?.doubleValue ?? 0
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.steps = steps
                self.meters = meters
            }
        }
    }

    func stop() {
        guard isRunning else { return }
        pedometer.stopUpdates()
        isRunning = false
    }

    var distanceLabel: String {
        if meters >= 1000 {
            return String(format: "%.1f km", meters / 1000)
        }
        return String(format: "%.0f m", meters)
    }
}
