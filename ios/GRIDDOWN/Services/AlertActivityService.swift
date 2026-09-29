import ActivityKit
import Foundation

/// Owns the single Live Activity shown on the Lock Screen and Dynamic Island
/// while the group alert level is elevated (amber/red). Synced from
/// `AppStore.writeWidgetSnapshot()` so every status change propagates
/// immediately; the activity ends with a brief ALL CLEAR state on green.
@MainActor
final class AlertActivityService {
    static let shared = AlertActivityService()

    private let sinceKey = "griddown_alert_since"
    private var lastState: AlertActivityAttributes.ContentState?

    private init() {}

    func sync(
        level: AlertLevel,
        groupName: String,
        readyCount: Int,
        memberCount: Int,
        overdueCount: Int,
        lowCount: Int
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        if level == .green {
            // Keep ALL CLEAR visible briefly so the dismissal reads as a
            // resolution, then the system removes the activity.
            let clearState = AlertActivityAttributes.ContentState(
                level: AlertLevel.green.rawValue,
                groupName: groupName,
                readyCount: readyCount,
                memberCount: memberCount,
                overdueCount: overdueCount,
                lowCount: lowCount,
                since: Date.now
            )
            endAll(finalState: clearState)
            return
        }

        let state = AlertActivityAttributes.ContentState(
            level: level.rawValue,
            groupName: groupName,
            readyCount: readyCount,
            memberCount: memberCount,
            overdueCount: overdueCount,
            lowCount: lowCount,
            since: resolvedSince
        )

        if let existing = Activity<AlertActivityAttributes>.activities.first {
            guard existing.content.state != state else { return }
            lastState = state
            Task { [state] in
                await existing.update(ActivityContent(state: state, staleDate: nil))
            }
        } else {
            lastState = state
            do {
                let activity = try Activity.request(
                    attributes: AlertActivityAttributes(),
                    content: ActivityContent(state: state, staleDate: nil),
                    pushType: nil
                )
                _ = activity
            } catch {
                // Live Activities can be disabled by the user or rate-limited
                // by the system; the in-app status remains the source of truth.
            }
        }
    }

    /// Preserves the "raised at" timestamp across app relaunches so the
    /// elapsed timer doesn't reset.
    private var resolvedSince: Date {
        if let last = lastState { return last.since }
        if let interval = UserDefaults.standard.object(forKey: sinceKey) as? TimeInterval {
            return Date(timeIntervalSince1970: interval)
        }
        let now = Date.now
        UserDefaults.standard.set(now.timeIntervalSince1970, forKey: sinceKey)
        return now
    }

    /// Ends every active alert activity. When a final state is provided it is
    /// shown briefly before the system removes the activity.
    func endAll(finalState: AlertActivityAttributes.ContentState? = nil) {
        lastState = nil
        UserDefaults.standard.removeObject(forKey: sinceKey)
        let activities = Activity<AlertActivityAttributes>.activities
        guard !activities.isEmpty else { return }
        Task { [finalState] in
            for activity in activities {
                if let finalState {
                    await activity.end(
                        ActivityContent(state: finalState, staleDate: nil),
                        dismissalPolicy: .after(Date.now.addingTimeInterval(600))
                    )
                } else {
                    await activity.end(nil, dismissalPolicy: .immediate)
                }
            }
        }
    }
}
