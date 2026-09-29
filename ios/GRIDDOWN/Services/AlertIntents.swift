import AppIntents

/// Siri / Shortcuts support for setting the group alert level. The intent
/// records the requested level in UserDefaults; the app applies it when it
/// becomes active (or immediately via notification when already running).
struct SetAlertLevelIntent: AppIntent {
    static let title: LocalizedStringResource = "Set Alert Level"
    static let description = IntentDescription("Set the GRIDDOWN group alert level.")
    static let openAppWhenRun = true

    @Parameter(title: "Level")
    var level: IntentAlertLevel

    @MainActor
    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(level.rawValue, forKey: BiometricLockService.intentAlertKey)
        NotificationCenter.default.post(name: .griddownIntentAlert, object: nil)
        return .result()
    }
}

enum IntentAlertLevel: String, AppEnum {
    case green = "green"
    case amber = "amber"
    case red = "red"

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Alert Level")
    static let caseDisplayRepresentations: [IntentAlertLevel: DisplayRepresentation] = [
        .green: DisplayRepresentation(title: "Green", subtitle: "Normal readiness"),
        .amber: DisplayRepresentation(title: "Amber", subtitle: "Heightened awareness"),
        .red: DisplayRepresentation(title: "Red", subtitle: "Immediate action"),
    ]
}

struct GRIDDOWNShortcuts: AppShortcutsProvider {
    static var shortcutTileColor: ShortcutTileColor { .orange }

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: SetAlertLevelIntent(),
            phrases: [
                "Set alert level to \(\.$level) in \(.applicationName)",
                "Set \(.applicationName) to \(\.$level)",
            ],
            shortTitle: "Set Alert Level",
            systemImageName: "exclamationmark.triangle.fill"
        )
    }
}

extension Notification.Name {
    static let griddownIntentAlert = Notification.Name("griddown.intent.alert")
}
