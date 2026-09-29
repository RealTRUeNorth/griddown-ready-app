import ActivityKit
import Foundation

/// Shared Live Activity model for an active group alert.
/// MUST stay identical to `GRIDDOWNWidget/AlertActivityAttributes.swift`
/// in the widget extension target.
nonisolated struct AlertActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var level: String
        var groupName: String
        var readyCount: Int
        var memberCount: Int
        var overdueCount: Int
        var lowCount: Int
        var since: Date
    }
}
