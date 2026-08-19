import SwiftUI

enum CheckInState: String, Sendable {
    case never, current, dueSoon, overdue

    var label: String {
        switch self {
        case .never: "NO CHECK-IN"
        case .current: "CURRENT"
        case .dueSoon: "DUE SOON"
        case .overdue: "OVERDUE"
        }
    }

    var color: Color {
        switch self {
        case .never: Theme.textMuted
        case .current: Theme.statusGreen
        case .dueSoon: Theme.statusAmber
        case .overdue: Theme.statusRed
        }
    }
}

/// Check-in cadence logic: a member is "dueSoon" once 75% of the interval has
/// elapsed and "overdue" once the full interval passes without a check-in.
enum CheckIn {
    static let intervalOptions = [2, 4, 6, 8, 12, 24]

    static func state(for member: GroupMember, intervalHours: Int, now: Date = Date()) -> CheckInState {
        guard let raw = member.lastCheckInAt, let last = parse(raw) else { return .never }
        let elapsed = now.timeIntervalSince(last)
        let interval = TimeInterval(intervalHours) * 3600
        if elapsed >= interval { return .overdue }
        if elapsed >= interval * 0.75 { return .dueSoon }
        return .current
    }

    static func timeSince(_ iso: String?, now: Date = Date()) -> String {
        guard let iso, let date = parse(iso) else { return "Never" }
        let seconds = now.timeIntervalSince(date)
        if seconds < 0 { return "Just now" }
        let minutes = Int(seconds / 60)
        if minutes < 1 { return "Just now" }
        if minutes < 60 { return "\(minutes)m ago" }
        let hours = minutes / 60
        if hours < 24 { return "\(hours)h ago" }
        return "\(hours / 24)d ago"
    }

    /// Returns how long a member is past their expected check-in, or nil if not overdue.
    static func overdueBy(_ member: GroupMember, intervalHours: Int, now: Date = Date()) -> String? {
        guard let raw = member.lastCheckInAt, let last = parse(raw) else { return nil }
        let overdue = now.timeIntervalSince(last) - TimeInterval(intervalHours) * 3600
        if overdue <= 0 { return nil }
        let minutes = Int(overdue / 60)
        if minutes < 60 { return "\(minutes)m overdue" }
        let hours = minutes / 60
        if hours < 24 { return "\(hours)h overdue" }
        return "\(hours / 24)d overdue"
    }

    private static func parse(_ iso: String) -> Date? {
        ISO8601DateFormatter().date(from: iso)
    }
}
