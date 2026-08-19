import SwiftUI

struct StatusView: View {
    @Environment(AppStore.self) var store
    @State private var editingSupply: SupplyItem?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                alertBanner
                statsRow1
                statsRow2
                inventoryAlertsSection
                quickAccessSection
                checklistStatusSection
                footer
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("GRIDDOWN")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $editingSupply) { item in
            AddSupplyView(existing: item)
        }
    }

    private struct InventoryBadge: Identifiable {
        let label: String
        let color: Color
        var id: String { label }
    }

    private struct InventoryAlertEntry: Identifiable {
        let item: SupplyItem
        var badges: [InventoryBadge]
        var id: String { item.id }
    }

    private var inventoryAlertEntries: [InventoryAlertEntry] {
        let summary = SupplyAlerts.inventoryAlerts(for: store.supplies)
        var order: [String] = []
        var map: [String: InventoryAlertEntry] = [:]
        func push(_ item: SupplyItem, _ label: String, _ color: Color) {
            if map[item.id] == nil {
                map[item.id] = InventoryAlertEntry(item: item, badges: [])
                order.append(item.id)
            }
            map[item.id]?.badges.append(InventoryBadge(label: label, color: color))
        }
        summary.expired.forEach { push($0, "EXPIRED", Theme.statusRed) }
        summary.low.forEach { push($0, "LOW STOCK", Theme.statusRed) }
        summary.expiringSoon.forEach { push($0, "EXPIRES SOON", Theme.statusAmber) }
        return order.compactMap { map[$0] }
    }

    @ViewBuilder
    private var inventoryAlertsSection: some View {
        let entries = inventoryAlertEntries
        if !entries.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel(text: "INVENTORY ALERTS")
                ForEach(entries) { entry in
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        editingSupply = entry.item
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 15))
                                .foregroundStyle(entry.badges.first?.color ?? Theme.statusAmber)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(entry.item.name)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Theme.textPrimary)
                                    .lineLimit(1)
                                Text("\(entry.item.quantity) \(entry.item.unit)\(entry.item.expirationDate.map { " · Exp \($0)" } ?? "")")
                                    .font(.system(size: 11))
                                    .foregroundStyle(Theme.textMuted)
                                    .lineLimit(1)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 4) {
                                ForEach(entry.badges) { badge in
                                    Text(badge.label)
                                        .font(.system(size: 8, weight: .heavy))
                                        .tracking(0.8)
                                        .foregroundStyle(badge.color)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(badge.color.opacity(0.15))
                                        .clipShape(.rect(cornerRadius: 4))
                                }
                            }
                        }
                        .padding(12)
                        .background(Theme.bgCard)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                        .clipShape(.rect(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                    .padding(.bottom, 8)
                }
            }
        }
    }

    private var alertBanner: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(store.alertLevel.color)
                    .font(.system(size: 22))
                Text(store.alertLevel.label)
                    .font(.system(size: 16, weight: .heavy))
                    .tracking(2)
                    .foregroundStyle(store.alertLevel.color)
            }
            Text(store.alertLevel.description)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textSecondary)
                .padding(.bottom, 14)
            HStack(spacing: 8) {
                ForEach(AlertLevel.allCases, id: \.self) { level in
                    Button {
                        UINotificationFeedbackGenerator().notificationOccurred(.warning)
                        store.updateAlertLevel(level)
                    } label: {
                        Text(level.rawValue.uppercased())
                            .font(.system(size: 12, weight: .bold))
                            .tracking(1)
                            .foregroundStyle(store.alertLevel == level ? .white : Theme.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(store.alertLevel == level ? level.color : Theme.bgCard)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(store.alertLevel == level ? level.color : Theme.border, lineWidth: 1)
                            )
                            .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(16)
        .background(store.alertLevel.bgColor)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 12))
        .padding(.bottom, 16)
    }

    private var statsRow1: some View {
        HStack(spacing: 10) {
            NavigationLink(value: NavRoute.group) {
                StatCard(icon: "person.2.fill", iconColor: Theme.oliveLight, label: "PERSONNEL", value: "\(store.members.filter { $0.status == .ready }.count)/\(store.members.count)", sublabel: "Ready")
            }
            .buttonStyle(.plain)
            NavigationLink(value: NavRoute.supplies) {
                StatCard(icon: "shippingbox.fill", iconColor: Theme.orangeLight, label: "SUPPLIES", value: "\(store.supplies.count)", sublabel: store.supplyStats.low > 0 ? "\(store.supplyStats.low) low" : "Stocked", alert: store.supplyStats.low > 0)
            }
            .buttonStyle(.plain)
        }
        .padding(.bottom, 10)
    }

    private var statsRow2: some View {
        HStack(spacing: 10) {
            NavigationLink(value: NavRoute.checklists) {
                StatCard(icon: "checkmark.square.fill", iconColor: Theme.greenLight, label: "READINESS", value: "\(store.overallChecklistStats.percent)%", sublabel: "\(store.overallChecklistStats.completed)/\(store.overallChecklistStats.total) items")
            }
            .buttonStyle(.plain)
            NavigationLink(value: NavRoute.guides) {
                StatCard(icon: "book.fill", iconColor: Theme.amberLight, label: "GUIDES", value: "6", sublabel: "Available")
            }
            .buttonStyle(.plain)
        }
        .padding(.bottom, 10)
    }

    private var quickAccessSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "QUICK ACCESS")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                NavigationLink(value: NavRoute.checklistDetail("cl1")) {
                    QuickAction(icon: "bolt.fill", label: "Bug-Out Bag")
                }
                .buttonStyle(.plain)
                NavigationLink(value: NavRoute.checklistDetail("cl3")) {
                    QuickAction(icon: "antenna.radiowaves.left.and.right", label: "Comms Plan")
                }
                .buttonStyle(.plain)
                NavigationLink(value: NavRoute.guideDetail("g6")) {
                    QuickAction(icon: "shield.fill", label: "Security")
                }
                .buttonStyle(.plain)
                NavigationLink(value: NavRoute.guideDetail("g2")) {
                    QuickAction(icon: "heart.fill", label: "First Aid")
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var checklistStatusSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "CHECKLIST STATUS")
            ForEach(store.checklists) { cl in
                if let stat = store.checklistStats(for: cl.id) {
                    NavigationLink(value: NavRoute.checklistDetail(cl.id)) {
                        ChecklistRow(title: cl.title, completed: stat.completed, total: stat.total, percent: stat.percent)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 4) {
            Text("ALL DATA STORED LOCALLY")
                .font(.system(size: 10, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.textMuted)
            Text("No internet required")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(.top, 30)
        .padding(.bottom, 16)
        .frame(maxWidth: .infinity)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }
}

private struct StatCard: View {
    let icon: String
    let iconColor: Color
    let label: String
    let value: String
    let sublabel: String
    var alert: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundStyle(iconColor)
                    .font(.system(size: 20))
                Text(label)
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(Theme.textMuted)
            }
            Text(value)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(Theme.textPrimary)
            Text(sublabel)
                .font(.system(size: 12))
                .foregroundStyle(alert ? Theme.statusRed : Theme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Theme.bgCard)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 12))
    }
}

private struct QuickAction: View {
    let icon: String
    let label: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundStyle(Theme.orange)
                .frame(width: 44, height: 44)
                .background(Theme.orangeMuted)
                .clipShape(Circle())
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Theme.bgCard)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 12))
    }
}

private struct ChecklistRow: View {
    let title: String
    let completed: Int
    let total: Int
    let percent: Int

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.textPrimary)
                Text("\(completed)/\(total) complete")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textMuted)
            }
            Spacer()
            ProgressBar(percent: percent)
                .frame(width: 60)
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 10))
        .padding(.bottom, 8)
    }
}
