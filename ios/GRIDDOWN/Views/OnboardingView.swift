import SwiftUI

/// First-run onboarding: what GRIDDOWN is, disclaimer acknowledgment, and
/// quick group setup. Shown once via fullScreenCover from ContentView.
struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @AppStorage("griddown_onboarding_complete") private var complete = false

    @State private var step = 0
    @State private var acknowledged = false
    @State private var groupName = "My Group"
    @State private var level: AlertLevel = .green

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            stepsIndicator
                .padding(.top, 24)
                .padding(.bottom, 32)

            Group {
                switch step {
                case 0: welcomeStep
                case 1: disclaimerStep
                default: setupStep
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

            footer
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
        .background(Theme.bg.ignoresSafeArea())
        .preferredColorScheme(.dark)
    }

    // MARK: - Steps

    private var welcomeStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image(systemName: "shield.fill")
                .font(.system(size: 44, weight: .bold))
                .foregroundStyle(Theme.oliveLight)
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Theme.oliveMuted.opacity(0.25))
                )
                .padding(.bottom, 8)

            Text("GRIDDOWN")
                .font(.system(size: 30, weight: .heavy))
                .tracking(2)
                .foregroundStyle(Theme.textPrimary)

            Text("Offline-first readiness for your group.")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)

            VStack(alignment: .leading, spacing: 14) {
                bullet("person.2.fill", "Roster, check-ins, and supply tracking — no accounts, no tracking, everything stays on this device.")
                bullet("antenna.radiowaves.left.and.right", "Maps, field guides, and an offline wiki library that work with zero signal.")
                bullet("exclamationmark.triangle.fill", "One-tap alert levels with a Lock Screen Live Activity and Siri support.")
            }
        }
    }

    private var disclaimerStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 36, weight: .bold))
                .foregroundStyle(Theme.amberLight)
                .padding(.bottom, 4)

            Text("Before You Continue")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(Theme.textPrimary)

            Text("GRIDDOWN is an educational preparedness tool. It is not a substitute for professional emergency services, official alerts, or medical advice. In a real emergency, always call your local emergency number.")
                .font(.system(size: 15))
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(4)

            Button {
                withAnimation(.easeInOut(duration: 0.15)) { acknowledged = true }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: acknowledged ? "checkmark.square.fill" : "square")
                        .font(.system(size: 22))
                        .foregroundStyle(acknowledged ? Theme.oliveLight : Theme.textMuted)
                    Text("I understand this is educational and not a substitute for professional emergency services.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.textPrimary)
                        .multilineTextAlignment(.leading)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Theme.bgCard)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(acknowledged ? Theme.olive : Theme.border, lineWidth: 1)
                        )
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var setupStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Set Up Your Group")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(Theme.textPrimary)

            VStack(alignment: .leading, spacing: 8) {
                Text("GROUP NAME")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(Theme.textMuted)
                TextField("My Group", text: $groupName)
                    .textFieldStyle(.plain)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.textPrimary)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Theme.bgCard)
                    )
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("CURRENT ALERT LEVEL")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(Theme.textMuted)
                HStack(spacing: 10) {
                    levelOption(.green, label: "ALL CLEAR")
                    levelOption(.amber, label: "ELEVATED")
                    levelOption(.red, label: "RED")
                }
            }

            Text("You can change the group name, alert level, and everything else later in the app.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textMuted)
        }
    }

    private func levelOption(_ value: AlertLevel, label: String) -> some View {
        let color = value == .green ? Theme.statusGreen : (value == .amber ? Theme.statusAmber : Theme.statusRed)
        let selected = level == value
        return Button {
            level = value
        } label: {
            VStack(spacing: 6) {
                Circle()
                    .fill(color)
                    .frame(width: 12, height: 12)
                Text(label)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .foregroundStyle(selected ? Theme.textPrimary : Theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Theme.bgCard)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(selected ? color : Theme.border, lineWidth: selected ? 2 : 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Chrome

    private var stepsIndicator: some View {
        HStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { i in
                Capsule()
                    .fill(i <= step ? Theme.orange : Theme.border)
                    .frame(width: i == step ? 22 : 6, height: 6)
                    .animation(.easeInOut(duration: 0.2), value: step)
            }
            Spacer()
        }
    }

    private var footer: some View {
        HStack(spacing: 12) {
            if step > 0 {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { step -= 1 }
                } label: {
                    Text("Back")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Theme.bgCard)
                        )
                }
                .buttonStyle(.plain)
            }

            Button {
                advance()
            } label: {
                Text(step == 2 ? "Enter GRIDDOWN" : "Continue")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(canAdvance ? Theme.bg : Theme.textMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(canAdvance ? Theme.orange : Theme.bgCard)
                    )
            }
            .buttonStyle(.plain)
            .disabled(!canAdvance)
        }
    }

    private var canAdvance: Bool {
        step != 1 || acknowledged
    }

    private func advance() {
        if step < 2 {
            withAnimation(.easeInOut(duration: 0.2)) { step += 1 }
            return
        }
        let trimmed = groupName.trimmingCharacters(in: .whitespaces)
        store.updateGroupName(trimmed.isEmpty ? "My Group" : trimmed)
        store.updateAlertLevel(level)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        complete = true
    }

    private func bullet(_ symbol: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Theme.orangeLight)
                .frame(width: 20)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(3)
        }
    }
}
