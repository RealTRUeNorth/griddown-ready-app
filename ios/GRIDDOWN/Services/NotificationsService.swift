import Foundation
import UserNotifications

/// Local notifications for check-in cadence reminders and supply expiry
/// alerts. All identifiers are namespaced so rescheduling one kind never
/// touches pending requests of the other.
enum NotificationsService {
    static let checkInIdentifier = "griddown.checkin.reminder"
    static let supplyPrefix = "griddown.supply."

    /// Prompts for notification permission. False if denied or errored.
    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    /// Schedules a repeating check-in reminder aligned to the group's cadence.
    /// Cancels any previous reminder first; no-op when hours <= 0.
    static func scheduleCheckInReminder(intervalHours: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [checkInIdentifier])
        guard intervalHours > 0 else { return }
        let content = UNMutableNotificationContent()
        content.title = "Check-In Due"
        content.body = "Log check-ins for your group so everyone stays marked ready."
        content.sound = .default
        let seconds = max(60, TimeInterval(intervalHours) * 3600)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: seconds, repeats: true)
        center.add(
            UNNotificationRequest(identifier: checkInIdentifier, content: content, trigger: trigger),
            withCompletionHandler: nil
        )
    }

    static func cancelCheckInReminder() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: [checkInIdentifier])
    }

    static func removeSupplyReminder(_ id: String) {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: [supplyPrefix + id])
    }

    /// Fires an immediate storm warning when the barometer detects a rapid
    /// pressure drop. Fire-and-forget: delivery failures are ignored.
    static func sendStormWarning(ratePerHour: Double) {
        let content = UNMutableNotificationContent()
        content.title = "Pressure Falling Fast"
        content.body = String(
            format: "Barometric pressure is dropping %.1f hPa/hr — deteriorating weather possible. Secure gear and check shelter.",
            abs(ratePerHour)
        )
        content.sound = .default
        let request = UNNotificationRequest(
            identifier: "griddown.storm.\(UUID().uuidString)", content: content, trigger: nil
        )
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    /// Fires an immediate test notification so users can verify reminders work.
    static func sendTest() {
        let content = UNMutableNotificationContent()
        content.title = "GRIDDOWN Reminders Active"
        content.body = "Check-in reminders and supply expiry alerts will appear here."
        content.sound = .default
        let request = UNNotificationRequest(
            identifier: "griddown.test.\(UUID().uuidString)", content: content, trigger: nil
        )
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    /// Schedules one alert fired 30 days before the item's expiration date
    /// (immediately if already inside the window). Past dates are skipped.
    static func scheduleSupplyReminder(_ item: SupplyItem) {
        removeSupplyReminder(item.id)
        guard let raw = item.expirationDate,
              let expiry = parseExpiry(raw),
              expiry > Date() else { return }
        let remindAt = max(
            expiry.addingTimeInterval(-30 * 24 * 3600),
            Date().addingTimeInterval(60)
        )
        guard remindAt < expiry else { return }
        let content = UNMutableNotificationContent()
        content.title = "Supply Expiring"
        content.body = "\(item.name) expires \(raw). Rotate or restock soon."
        content.sound = .default
        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: remindAt
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: supplyPrefix + item.id, content: content, trigger: trigger),
            withCompletionHandler: nil
        )
    }

    /// Parses supply expiration strings: "yyyy-MM-dd" or "yyyy-MM"
    /// (month-only dates expire at the start of the following month).
    static func parseExpiry(_ raw: String) -> Date? {
        let dayFormatter = DateFormatter()
        dayFormatter.locale = Locale(identifier: "en_US_POSIX")
        dayFormatter.dateFormat = "yyyy-MM-dd"
        if let date = dayFormatter.date(from: raw) {
            return date
        }
        let monthFormatter = DateFormatter()
        monthFormatter.locale = Locale(identifier: "en_US_POSIX")
        monthFormatter.dateFormat = "yyyy-MM"
        if let date = monthFormatter.date(from: raw) {
            return Calendar.current.date(byAdding: .month, value: 1, to: date)
        }
        return nil
    }
}
