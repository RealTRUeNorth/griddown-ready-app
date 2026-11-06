import AppIntents
import ActivityKit
import WidgetKit
import Foundation

/// Alert-level AppEnum for interactive widget / Live Activity controls.
/// Separate from the app target's `IntentAlertLevel` — keep raw values in
/// sync ("green" / "amber" / "red").
enum WidgetAlertLevel: String, AppEnum {
    case green = "green"
    case amber = "amber"
    case red = "red"

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Alert Level")
    static let caseDisplayRepresentations: [WidgetAlertLevel: DisplayRepresentation] = [
        .green: DisplayRepresentation(title: "All Clear"),
        .amber: DisplayRepresentation(title: "Elevated"),
        .red: DisplayRepresentation(title: "Red Alert"),
    ]
}

/// Runs in the widget extension process: records the requested level in the
/// shared App Group container (the app applies it to the real store on next
/// activation) and refreshes the Live Activity + widget timelines instantly.
struct WidgetSetAlertLevelIntent: AppIntent {
    static let title: LocalizedStringResource = "Set Alert Level"
    static let openAppWhenRun = false

    @Parameter(title: "Level")
    var level: WidgetAlertLevel

    init() {}

    init(level: WidgetAlertLevel) {
        self.level = level
    }

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.app.rork.m1n8sfy2h3980p3hrfm5j")
        // Consumed by AppStore.consumePendingWidgetAlertLevel() on activation.
        defaults?.set(level.rawValue, forKey: "griddown_pending_alert_level")
        // Keep the widget snapshot fresh so home-screen widgets show the
        // change without waiting for the app to run.
        defaults?.set(level.rawValue, forKey: "widget_alert_level")

        if level == .green {
            for activity in Activity<AlertActivityAttributes>.activities {
                var clear = activity.content.state
                clear.level = "green"
                clear.since = .now
                await activity.end(
                    ActivityContent(state: clear, staleDate: nil),
                    dismissalPolicy: .after(.now.addingTimeInterval(600))
                )
            }
        } else {
            for activity in Activity<AlertActivityAttributes>.activities {
                var state = activity.content.state
                state.level = level.rawValue
                await activity.update(ActivityContent(state: state, staleDate: nil))
            }
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
