import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) var store
    @State private var nameDraft: String = ""

    private var isNameDirty: Bool {
        let trimmed = nameDraft.trimmingCharacters(in: .whitespaces)
        return !trimmed.isEmpty && trimmed != store.groupName
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel(text: "GROUP")

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.oliveLight)
                        Text("Group Name")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    TextField("My Group", text: $nameDraft)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 11)
                        .background(Theme.bg)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
                        .clipShape(.rect(cornerRadius: 8))
                        .onSubmit { saveName() }
                    Button { saveName() } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark").font(.system(size: 13, weight: .bold))
                            Text("Save Name").font(.system(size: 13, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(isNameDirty ? Theme.olive : Theme.bgElevated)
                        .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                    .disabled(!isNameDirty)
                    Text("Shown at the top of the Group Roster and included in ops backups.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))

                SectionLabel(text: "CHECK-IN CADENCE")

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.orangeLight)
                        Text("Expected Check-In Interval")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    Text("Members are marked overdue if they haven't checked in within this window.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                    FlowLayout(spacing: 8) {
                        ForEach(CheckIn.intervalOptions, id: \.self) { hours in
                            let isActive = store.checkInIntervalHours == hours
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                store.updateCheckInInterval(hours)
                            } label: {
                                Text("\(hours)h")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(isActive ? .white : Theme.textSecondary)
                                    .padding(.horizontal, 18)
                                    .padding(.vertical, 10)
                                    .background(isActive ? Theme.orange : Theme.bg)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(isActive ? Theme.orange : Theme.border, lineWidth: 1)
                                    )
                                    .clipShape(.rect(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))

                SectionLabel(text: "REMINDERS")

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.orangeLight)
                        Text("Check-In & Expiry Alerts")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    Text("A repeating check-in reminder follows your cadence above. Supply alerts fire 30 days before expiration dates. All notifications are local — nothing leaves this device.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                    Toggle(isOn: Binding(
                        get: { store.remindersEnabled },
                        set: { store.updateRemindersEnabled($0) }
                    )) {
                        Text(store.remindersEnabled ? "Reminders On" : "Reminders Off")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    .tint(Theme.statusGreen)
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        Task {
                            if await NotificationsService.requestAuthorization() {
                                NotificationsService.sendTest()
                            }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "paperplane.fill").font(.system(size: 13, weight: .bold))
                            Text("Send Test Notification").font(.system(size: 13, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Theme.olive)
                        .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))

                SectionLabel(text: "SENSORS")

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "iphone.radiowaves.left.and.right")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.oliveLight)
                        Text("Shake for SOS")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    Text("Shake the phone firmly to trigger a RED alert confirmation. Useful when you can't reach the screen. Keep it off if you carry the device loosely.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                    Toggle(isOn: Binding(
                        get: { store.shakeSosEnabled },
                        set: { store.updateShakeSos($0) }
                    )) {
                        Text(store.shakeSosEnabled ? "Shake SOS On" : "Shake SOS Off")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    .tint(Theme.statusGreen)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))

                SectionLabel(text: "STARTER CONTENT")

                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.oliveLight)
                        Text("Sample Data Notice")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    Text("Your kit starts with sample members, supplies, POIs, and routes so you can explore before entering real data. Sample supplies are marked SAMPLE and include intentionally expired items that demonstrate the expiry alert system — they are not your inventory. Edit or delete each record and add your own.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))

                SectionLabel(text: "ABOUT")

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "internaldrive.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                        Text("Local Data")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                    }
                    Text(store.opsCountsSummary)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                    Text("GRIDDOWN stores everything on this device. Export an ops backup from the Intel tab to share or safeguard your data.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 12))
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { nameDraft = store.groupName }
    }

    private func saveName() {
        guard isNameDirty else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        store.updateGroupName(nameDraft.trimmingCharacters(in: .whitespaces))
    }
}
