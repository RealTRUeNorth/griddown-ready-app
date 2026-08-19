import Foundation

enum ExpirationStatus {
    case expired, soon, ok, none
}

/// Mirrors the Expo app's supply alert helpers: expiration parsing,
/// low-stock detection, and an aggregated inventory alert summary.
enum SupplyAlerts {
    static let soonWindowDays = 30

    /// Parses "YYYY-MM" (treated as end of month), "YYYY-MM-DD", or ISO 8601 strings.
    static func parseExpirationDate(_ raw: String?) -> Date? {
        guard let raw else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return nil }

        if trimmed.contains("T") {
            return ISO8601DateFormatter().date(from: trimmed)
        }

        let parts = trimmed.split(separator: "-")
        let calendar = Calendar(identifier: .gregorian)

        if parts.count == 2,
           let year = Int(parts[0]), let month = Int(parts[1]),
           (1...12).contains(month) {
            var comps = DateComponents()
            comps.year = year
            comps.month = month + 1
            comps.day = 1
            guard let firstOfNext = calendar.date(from: comps) else { return nil }
            return calendar.date(byAdding: .second, value: -1, to: firstOfNext)
        }

        if parts.count == 3,
           let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
           (1...12).contains(month), (1...31).contains(day) {
            var comps = DateComponents()
            comps.year = year
            comps.month = month
            comps.day = day
            comps.hour = 23
            comps.minute = 59
            comps.second = 59
            return calendar.date(from: comps)
        }

        return ISO8601DateFormatter().date(from: trimmed)
    }

    static func isLow(_ item: SupplyItem) -> Bool {
        item.quantity <= item.minimumQuantity
    }

    static func expirationStatus(for item: SupplyItem, now: Date = Date()) -> ExpirationStatus {
        guard let date = parseExpirationDate(item.expirationDate) else { return .none }
        if date < now { return .expired }
        if let soonCutoff = Calendar.current.date(byAdding: .day, value: soonWindowDays, to: now),
           date <= soonCutoff {
            return .soon
        }
        return .ok
    }

    struct InventorySummary {
        var low: [SupplyItem] = []
        var expired: [SupplyItem] = []
        var expiringSoon: [SupplyItem] = []

        var isEmpty: Bool { low.isEmpty && expired.isEmpty && expiringSoon.isEmpty }
    }

    static func inventoryAlerts(for supplies: [SupplyItem], now: Date = Date()) -> InventorySummary {
        var summary = InventorySummary()
        for item in supplies {
            if isLow(item) { summary.low.append(item) }
            switch expirationStatus(for: item, now: now) {
            case .expired: summary.expired.append(item)
            case .soon: summary.expiringSoon.append(item)
            default: break
            }
        }
        return summary
    }
}
