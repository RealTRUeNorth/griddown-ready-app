import Foundation
import CoreMotion

/// Streams the device barometer via Core Motion and derives a rolling
/// pressure trend. Mirrors the Expo app: samples every ~5s, keeps a
/// 30-minute window, and flags storm risk when pressure falls fast.
@MainActor
@Observable
final class BarometerService {
    enum PressureTrend {
        case steady, rising, falling
    }

    struct Reading {
        var pressure: Double? // hPa
        var trend: PressureTrend = .steady
        var ratePerHour: Double?
        var stormRisk = false
    }

    var isAvailable: Bool { CMAltimeter.isRelativeAltitudeAvailable() }
    var reading = Reading()

    private let altimeter = CMAltimeter()
    private var samples: [(date: Date, pressure: Double)] = []
    private var lastSample = Date.distantPast
    private var isMonitoring = false

    func start() {
        guard !isMonitoring, CMAltimeter.isRelativeAltitudeAvailable() else { return }
        isMonitoring = true
        altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, _ in
            guard let data else { return }
            // CMAltitudeData.pressure is kilopascals — convert to hPa.
            let hPa = data.pressure.doubleValue * 10
            Task { @MainActor [weak self] in
                self?.record(pressure: hPa)
            }
        }
    }

    func stop() {
        guard isMonitoring else { return }
        altimeter.stopRelativeAltitudeUpdates()
        isMonitoring = false
    }

    private func record(pressure: Double) {
        let now = Date()
        guard now.timeIntervalSince(lastSample) >= 5 else { return }
        lastSample = now
        samples.append((now, pressure))
        let cutoff = now.addingTimeInterval(-30 * 60)
        samples.removeAll { $0.date < cutoff }

        reading.pressure = pressure
        guard let first = samples.first else {
            reading.trend = .steady
            reading.ratePerHour = nil
            reading.stormRisk = false
            return
        }
        let windowHours = now.timeIntervalSince(first.date) / 3600
        guard windowHours >= 0.05 else {
            reading.trend = .steady
            reading.ratePerHour = nil
            reading.stormRisk = false
            return
        }
        let rate = (pressure - first.pressure) / windowHours
        reading.ratePerHour = rate
        reading.trend = rate < -0.5 ? .falling : (rate > 0.5 ? .rising : .steady)
        reading.stormRisk = rate <= -1.5
    }
}
