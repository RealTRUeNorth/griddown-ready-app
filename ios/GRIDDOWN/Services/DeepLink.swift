import Foundation

/// Centralizes deep-link targets shared by widget URLs (`griddown://...`)
/// and local-notification taps. ContentView consumes these to switch tabs
/// and push routes. Nonisolated so its conformances are usable from any
/// context (unit tests included).
nonisolated enum DeepLink {
    enum Target {
        case status
        case supplies
    }

    static let scheme = "griddown"
    // Mirrors NotificationsService.supplyPrefix (kept inline so this type
    // stays nonisolated).
    private static let supplyPrefix = "griddown.supply."

    /// Maps a deep-link URL to a target; nil when unrecognized.
    static func route(for url: URL) -> Target? {
        guard url.scheme?.lowercased() == scheme else { return nil }
        switch (url.host ?? "").lowercased() {
        case "supplies": return .supplies
        default: return .status
        }
    }

    /// Maps a local notification identifier to the screen it should open.
    static func route(forNotificationIdentifier id: String) -> Target {
        if id.hasPrefix(supplyPrefix) { return .supplies }
        return .status
    }
}

extension Notification.Name {
    /// Fired when a notification tap should navigate the app. Object is a
    /// `DeepLink.Target`.
    static let griddownDeepLink = Notification.Name("griddown.deeplink")
}
