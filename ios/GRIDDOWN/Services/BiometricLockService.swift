import LocalAuthentication
import Observation

/// Optional Face ID / passcode gate shown over the whole app. The flag is a
/// device-local preference — deliberately excluded from ops backups.
@MainActor
@Observable
final class BiometricLockService {
    static let storageKey = "griddown_biometric_lock"
    static let intentAlertKey = "griddown_intent_alert_level"

    static let shared = BiometricLockService()

    var isEnabled: Bool {
        didSet { UserDefaults.standard.set(isEnabled, forKey: Self.storageKey) }
    }

    private(set) var isLocked = false
    private(set) var biometryLabel = "Face ID / Touch ID"

    init() {
        isEnabled = UserDefaults.standard.object(forKey: Self.storageKey) as? Bool ?? false
        refreshBiometry()
        if isEnabled { isLocked = true }
    }

    func refreshBiometry() {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            biometryLabel = "Passcode"
            return
        }
        switch context.biometryType {
        case .faceID: biometryLabel = "Face ID"
        case .touchID: biometryLabel = "Touch ID"
        case .opticID: biometryLabel = "Optic ID"
        default: biometryLabel = "Passcode"
        }
    }

    var canUseBiometrics: Bool {
        var error: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    }

    /// Locks the app if the feature is on. Called when entering background.
    func lockIfNeeded() {
        guard isEnabled else { return }
        isLocked = true
    }

    /// Prompts the system auth UI (biometrics with passcode fallback).
    /// Returns true when the app is unlocked.
    func authenticate() async -> Bool {
        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"
        do {
            let ok = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: "Unlock your GRIDDOWN ops kit"
            )
            if ok { isLocked = false }
            return ok
        } catch {
            return false
        }
    }

    /// Applies an alert level set via Siri / App Intents while the app was
    /// backgrounded, clearing the pending value. Returns the applied level.
    func consumeIntentAlertLevel() -> AlertLevel? {
        guard let raw = UserDefaults.standard.string(forKey: Self.intentAlertKey) else { return nil }
        UserDefaults.standard.removeObject(forKey: Self.intentAlertKey)
        return AlertLevel.allCases.first { $0.rawValue.caseInsensitiveCompare(raw) == .orderedSame }
    }
}
