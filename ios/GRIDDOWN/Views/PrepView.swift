import SwiftUI

struct PrepView: View {
    @Environment(AppStore.self) var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "OPERATIONAL READINESS")

                NavigationLink(value: NavRoute.weather) {
                    NavCard(
                        icon: "sun.max.fill", iconColor: Color(hex: 0xF6C243),
                        iconBg: Color(hex: 0xF6C243).opacity(0.15),
                        title: "Weather & Conditions",
                        description: "Live forecast, wind, precipitation & operational impact assessment"
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(value: NavRoute.supplies) {
                    NavCard(
                        icon: "shippingbox.fill", iconColor: Theme.orangeLight,
                        iconBg: Theme.orangeMuted,
                        title: "Supply Inventory",
                        description: "\(store.supplyStats.total) items across \(store.supplyStats.categories) categories",
                        badge: store.supplyStats.low > 0 ? "\(store.supplyStats.low) LOW" : nil,
                        badgeColor: store.supplyStats.low > 0 ? Theme.statusRed : nil
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(value: NavRoute.checklists) {
                    NavCard(
                        icon: "checkmark.square.fill", iconColor: Theme.greenLight,
                        iconBg: Theme.statusGreen.opacity(0.15),
                        title: "Readiness Checklists",
                        description: "\(store.overallChecklistStats.completed)/\(store.overallChecklistStats.total) items completed",
                        badge: "\(store.overallChecklistStats.percent)%",
                        badgeColor: store.overallChecklistStats.percent == 100 ? Theme.statusGreen : store.overallChecklistStats.percent > 50 ? Theme.statusAmber : Theme.orange
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Prep")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct NavCard: View {
    let icon: String
    let iconColor: Color
    let iconBg: Color
    let title: String
    let description: String
    var badge: String?
    var badgeColor: Color?

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(iconColor)
                .frame(width: 52, height: 52)
                .background(iconBg)
                .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    if let badge, let bc = badgeColor {
                        BadgeView(text: badge, color: bc)
                    }
                }
                Text(description)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textSecondary)
                    .lineLimit(2)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 14))
    }
}
