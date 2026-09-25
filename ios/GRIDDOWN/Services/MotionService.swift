import Foundation
import CoreMotion
import UIKit

/// Detects a firm device shake using the raw accelerometer so the app can
/// offer an SOS alert-level change without touching the screen. Requires
/// several consecutive strong samples plus a cooldown so ordinary handling
/// and bumps never fire it.
@MainActor
@Observable
final class MotionService {
    var onShake: (() -> Void)?

    private let motionManager = CMMotionManager()
    private var strongSamples = 0
    private var lastFire = Date.distantPast
    private var isMonitoring = false

    private let shakeThreshold = 2.6 // total acceleration in g
    private let requiredSamples = 3
    private let cooldown: TimeInterval = 5

    func start() {
        guard !isMonitoring, motionManager.isAccelerometerAvailable else { return }
        strongSamples = 0
        motionManager.accelerometerUpdateInterval = 0.1
        isMonitoring = true
        // No-handler variant delivers updates on the main thread; poll on a timer.
        motionManager.startAccelerometerUpdates()
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            Task { @MainActor [weak self] in
                guard let self, self.isMonitoring else {
                    timer.invalidate()
                    return
                }
                self.poll()
            }
        }
    }

    func stop() {
        guard isMonitoring else { return }
        motionManager.stopAccelerometerUpdates()
        isMonitoring = false
    }

    private func poll() {
        guard let data = motionManager.accelerometerData else { return }
        let a = data.acceleration
        let magnitude = sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
        if magnitude > shakeThreshold {
            strongSamples += 1
        } else {
            strongSamples = max(0, strongSamples - 1)
        }
        guard strongSamples >= requiredSamples else { return }
        strongSamples = 0
        let now = Date()
        guard now.timeIntervalSince(lastFire) > cooldown else { return }
        lastFire = now
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
        onShake?()
    }
}
