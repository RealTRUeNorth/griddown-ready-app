import ActivityKit
import WidgetKit
import SwiftUI

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

private func alertColor(_ level: String) -> Color {
    switch level.lowercased() {
    case "red": return Color(hex: 0xF44336)
    case "amber": return Color(hex: 0xFFC107)
    default: return Color(hex: 0x4CAF50)
    }
}

private func alertLabel(_ level: String) -> String {
    switch level.lowercased() {
    case "red": return "RED ALERT"
    case "amber": return "ELEVATED"
    default: return "ALL CLEAR"
    }
}

private func alertSymbol(_ level: String) -> String {
    switch level.lowercased() {
    case "red": return "exclamationmark.triangle.fill"
    case "amber": return "eye.fill"
    default: return "checkmark.shield.fill"
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

private func statsRow(_ state: AlertActivityAttributes.ContentState) -> some View {
    let overdueColor = state.overdueCount > 0 ? Color(hex: 0xF44336) : Color(hex: 0x9A9890)
    let lowColor = state.lowCount > 0 ? Color(hex: 0xFFC107) : Color(hex: 0x9A9890)
    return HStack(spacing: 16) {
        stat("READY", "\(state.readyCount)/\(state.memberCount)", Color(hex: 0x9A9890))
        stat("OVERDUE", "\(state.overdueCount)", overdueColor)
        stat("LOW", "\(state.lowCount)", lowColor)
        Spacer(minLength: 0)
    }
}

// MARK: - Lock Screen / banner

struct LockScreenAlertView: View {
    let state: AlertActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Circle()
                    .fill(alertColor(state.level))
                    .frame(width: 9, height: 9)
                Text(alertLabel(state.level))
                    .font(.system(size: 15, weight: .heavy))
                    .tracking(1.5)
                    .foregroundStyle(alertColor(state.level))
                Spacer()
                Text("SINCE")
                    .font(.system(size: 8, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(Color(hex: 0x6A6860))
                Text(state.since, style: .timer)
                    .font(.system(size: 14, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Color(hex: 0xE8E4DC))
                    .frame(maxWidth: 78, alignment: .trailing)
            }
            Text(state.groupName)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(Color(hex: 0xE8E4DC))
                .lineLimit(1)
            statsRow(state)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Widget

struct AlertLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlertActivityAttributes.self) { context in
            LockScreenAlertView(state: context.state)
                .activityBackgroundTint(Color(hex: 0x141713))
                .activitySystemActionForegroundColor(Color(hex: 0xE8E4DC))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: alertSymbol(context.state.level))
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(alertColor(context.state.level))
                        Text(alertLabel(context.state.level))
                            .font(.system(size: 13, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(alertColor(context.state.level))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("SINCE")
                            .font(.system(size: 8, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(Color(hex: 0x6A6860))
                        Text(context.state.since, style: .timer)
                            .font(.system(size: 15, weight: .heavy, design: .monospaced))
                            .foregroundStyle(Color(hex: 0xE8E4DC))
                            .frame(maxWidth: 68, alignment: .trailing)
                            .monospacedDigit()
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.state.groupName)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Color(hex: 0xE8E4DC))
                            .lineLimit(1)
                        statsRow(context.state)
                    }
                }
            } compactLeading: {
                Circle()
                    .fill(alertColor(context.state.level))
                    .frame(width: 7, height: 7)
            } compactTrailing: {
                Text("\(context.state.readyCount)/\(context.state.memberCount)")
                    .font(.system(size: 12, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Color(hex: 0xE8E4DC))
                    .monospacedDigit()
            } minimal: {
                Circle()
                    .fill(alertColor(context.state.level))
                    .frame(width: 7, height: 7)
            }
        }
    }
}
