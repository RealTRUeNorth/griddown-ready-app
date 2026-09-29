import CoreLocation
import Observation

/// Streams device heading from the magnetometer for the map compass and
/// rally-point bearings. Uses whichever heading the system provides
/// (true heading when location is authorized, otherwise magnetic).
@MainActor
@Observable
final class CompassService: NSObject, CLLocationManagerDelegate {
    private(set) var heading: Double = 0
    private(set) var accuracy: Double = -1

    var isAvailable: Bool { CLLocationManager.headingAvailable() }

    private let manager = CLLocationManager()
    private var isRunning = false

    override init() {
        super.init()
        manager.delegate = self
        manager.headingFilter = 3
    }

    func start() {
        guard !isRunning, CLLocationManager.headingAvailable() else { return }
        isRunning = true
        manager.startUpdatingHeading()
    }

    func stop() {
        guard isRunning else { return }
        manager.stopUpdatingHeading()
        isRunning = false
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        let value = newHeading.trueHeading >= 0 ? newHeading.trueHeading : newHeading.magneticHeading
        let acc = newHeading.headingAccuracy
        Task { @MainActor [weak self] in
            self?.heading = value
            self?.accuracy = acc
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Heading updates can fail transiently; the next update recovers.
    }
}

extension CompassService {
    /// Cardinal abbreviation for a heading in degrees (N, NNE, ...).
    static func cardinal(for degrees: Double) -> String {
        let names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        let normalized = (degrees.truncatingRemainder(dividingBy: 360) + 360)
            .truncatingRemainder(dividingBy: 360)
        let index = Int(((normalized + 11.25) / 22.5).truncatingRemainder(dividingBy: 16))
        return names[index]
    }
}
