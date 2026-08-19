import SwiftUI

struct SuppliesView: View {
    @Environment(AppStore.self) var store
    @State private var filterCategory: SupplyCategory? = nil
    @State private var showingAddSupply = false
    @State private var searchQuery: String = ""
    @State private var editingSupply: SupplyItem?
    @State private var pendingDelete: SupplyItem?

    var filtered: [SupplyItem] {
        var result = store.supplies
        if let filterCategory {
            result = result.filter { $0.category == filterCategory }
        }
        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter { $0.name.lowercased().contains(q) }
        }
        return result
    }

    var grouped: [(String, [SupplyItem])] {
        let groups = Dictionary(grouping: filtered) { $0.category.label }
        return groups.sorted { $0.key < $1.key }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                statsBar
                searchField
                filterChips
                if grouped.isEmpty && !store.supplies.isEmpty {
                    EmptyStateView(icon: "magnifyingglass", title: "No supplies found", subtitle: "Try a different search or category filter")
                }
                if grouped.isEmpty && store.supplies.isEmpty {
                    EmptyStateView(icon: "shippingbox.fill", title: "No supplies tracked", subtitle: "Add items to your inventory to track quantities and expiration dates")
                }
                ForEach(grouped, id: \.0) { category, items in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(category.uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .tracking(2)
                            .foregroundStyle(Theme.textMuted)
                        ForEach(items) { item in
                            supplyCard(item)
                        }
                    }
                }
            }
            .padding(16)
            .padding(.bottom, 100)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Supplies")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .bottomTrailing) {
            FAB { showingAddSupply = true }
                .padding(20)
        }
        .sheet(isPresented: $showingAddSupply) {
            AddSupplyView()
        }
        .sheet(item: $editingSupply) { item in
            AddSupplyView(existing: item)
        }
        .confirmationDialog(
            "Remove \"\(pendingDelete?.name ?? "item")\" from inventory?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Remove", role: .destructive) {
                if let item = pendingDelete {
                    store.removeSupply(item.id)
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        }
    }

    private var statsBar: some View {
        HStack {
            statItem(value: "\(store.supplyStats.total)", label: "ITEMS")
            Rectangle().fill(Theme.border).frame(width: 1, height: 30)
            statItem(value: "\(store.supplyStats.categories)", label: "CATEGORIES")
            Rectangle().fill(Theme.border).frame(width: 1, height: 30)
            statItem(value: "\(store.supplyStats.low)", label: "LOW", color: store.supplyStats.low > 0 ? Theme.statusRed : nil)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private func statItem(value: String, label: String, color: Color? = nil) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(color ?? Theme.textPrimary)
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Theme.textMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundStyle(Theme.textMuted)
            TextField("Search supplies by name...", text: $searchQuery)
                .font(.system(size: 14))
                .foregroundStyle(Theme.textPrimary)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            if !searchQuery.isEmpty {
                Button {
                    searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.textMuted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(text: "All", isActive: filterCategory == nil, activeColor: Theme.orange) {
                    filterCategory = nil
                }
                ForEach(SupplyCategory.allCases, id: \.self) { cat in
                    FilterChip(text: cat.label, isActive: filterCategory == cat, activeColor: Theme.orange) {
                        filterCategory = cat
                    }
                }
            }
        }
    }

    private func supplyCard(_ item: SupplyItem) -> some View {
        let isLow = item.quantity <= item.minimumQuantity
        let expStatus = SupplyAlerts.expirationStatus(for: item)
        return Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            editingSupply = item
        } label: {
            HStack(spacing: 10) {
                Image(systemName: item.category.iconName)
                    .font(.system(size: 16))
                    .foregroundStyle(item.category.color)
                    .frame(width: 34, height: 34)
                    .background(Theme.bgElevated)
                    .clipShape(.rect(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.textPrimary)
                    Text("\(item.quantity) \(item.unit)\(item.expirationDate.map { " · Exp: \($0)" } ?? "")")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textSecondary)
                }
                Spacer()
                if isLow || expStatus == .expired {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.statusRed)
                } else if expStatus == .soon {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.statusAmber)
                }
            }
            .padding(12)
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 10))
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button {
                editingSupply = item
            } label: {
                Label("Edit", systemImage: "pencil")
            }
            Button(role: .destructive) {
                pendingDelete = item
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .padding(.bottom, 6)
    }
}
