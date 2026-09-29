import WidgetKit
import SwiftUI

/// Compact snapshot the main app publishes to the shared App Group
/// container; the widget only ever reads these values.
nonisolated struct OpsSnapshot {
    let alertLevel: String
    let groupName: String
    let readyCount: Int
    let memberCount: Int
    let overdueCount: Int
    let lowCount: Int

    static func load() -> OpsSnapshot {
        let defaults = UserDefaults(suiteName: "group.app.rork.m1n8sfy2h3980p3hrfm5j")
        return OpsSnapshot(
            alertLevel: defaults?.string(forKey: "widget_alert_level") ?? "green",
            groupName: defaults?.string(forKey: "widget_group_name") ?? "My Group",
            readyCount: defaults?.integer(forKey: "widget_ready_count") ?? 0,
            memberCount: defaults?.integer(forKey: "widget_member_count") ?? 0,
            overdueCount: defaults?.integer(forKey: "widget_overdue_count") ?? 0,
            lowCount: defaults?.integer(forKey: "widget_low_count") ?? 0
        )
    }
}

nonisolated struct OpsEntry: TimelineEntry {
    let date: Date
    let snapshot: OpsSnapshot
}

nonisolated struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> OpsEntry {
        OpsEntry(date: .now, snapshot: .load())
    }

    func getSnapshot(in context: Context, completion: @escaping (OpsEntry) -> Void) {
        completion(OpsEntry(date: .now, snapshot: .load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OpsEntry>) -> Void) {
        let entry = OpsEntry(date: .now, snapshot: .load())
        // The app requests timeline reloads on every data change; this is
        // only the fallback refresh.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Theme

private extension Color {
    init(hex: UInt) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: 1.0
        )
    }
}

private struct AlertStyle {
    let name: String
    let color: Color
    let background: Color
}

private func alertStyle(for level: String) -> AlertStyle {
    switch level.lowercased() {
    case "red":
        return AlertStyle(name: "RED ALERT", color: Color(hex: 0xF44336), background: Color(hex: 0x331414))
    case "amber":
        return AlertStyle(name: "ELEVATED", color: Color(hex: 0xFFC107), background: Color(hex: 0x332910))
    default:
        return AlertStyle(name: "ALL CLEAR", color: Color(hex: 0x4CAF50), background: Color(hex: 0x14291B))
    }
}

// MARK: - Views

struct WidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        let style = alertStyle(for: entry.snapshot.alertLevel)
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Circle()
                    .fill(style.color)
                    .frame(width: 8, height: 8)
                Text(style.name)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(1.5)
                    .foregroundStyle(style.color)
                    .lineLimit(1)
            }
            Text(entry.snapshot.groupName)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Color(hex: 0xE8E4DC))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            statRow
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(style.background, for: .widget)
    }

    private var statRow: some View {
        let overdueColor = entry.snapshot.overdueCount > 0 ? Color(hex: 0xF44336) : Color(hex: 0x9A9890)
        let lowColor = entry.snapshot.lowCount > 0 ? Color(hex: 0xFFC107) : Color(hex: 0x9A9890)
        return HStack(spacing: 14) {
            stat("READY", "\(entry.snapshot.readyCount)/\(entry.snapshot.memberCount)", Color(hex: 0x9A9890))
            stat("OVERDUE", "\(entry.snapshot.overdueCount)", overdueColor)
            stat("LOW", "\(entry.snapshot.lowCount)", lowColor)
            Spacer(minLength: 0)
        }
    }

    private func stat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.system(size: 14, weight: .heavy, design: .monospaced))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 8, weight: .heavy))
                .tracking(1)
                .foregroundStyle(Color(hex: 0x6A6860))
        }
    }
}

struct GRIDDOWNWidget: Widget {
    let kind: String = "GRIDDOWNWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("GRIDDOWN Status")
        .description("Group alert level, readiness, and inventory alerts at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
