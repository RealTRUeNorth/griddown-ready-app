import SwiftUI

struct IntelView: View {
    @Environment(AppStore.self) var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "PERSONNEL & RESOURCES")

                NavigationLink(value: NavRoute.group) {
                    NavCard(
                        icon: "person.2.fill", iconColor: Theme.oliveLight,
                        iconBg: Theme.oliveMuted,
                        title: "Group Roster",
                        description: "\(store.members.count) member\(store.members.count != 1 ? "s" : "") registered",
                        badge: "\(store.members.filter { $0.status == .ready }.count) READY",
                        badgeColor: store.members.allSatisfy { $0.status == .ready } ? Theme.statusGreen : Theme.statusAmber
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(value: NavRoute.library) {
                    NavCard(
                        icon: "books.vertical.fill", iconColor: Theme.amberLight,
                        iconBg: Theme.amberLight.opacity(0.15),
                        title: "Kiwix Offline Library",
                        description: "Downloadable reference files for offline preparedness",
                        badge: store.kiwixLibrary.count > 0 ? "\(store.kiwixLibrary.count) SAVED" : nil,
                        badgeColor: Theme.green
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(value: NavRoute.guides) {
                    NavCard(
                        icon: "book.fill", iconColor: Theme.orangeLight,
                        iconBg: Theme.orangeMuted,
                        title: "Field Guides",
                        description: "Offline reference cards for emergency scenarios",
                        badge: "\(MockData.guides.count)",
                        badgeColor: Theme.olive
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Intel")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct GroupView: View {
    @Environment(AppStore.self) var store
    @State private var showingAddMember = false
    @State private var searchQuery: String = ""

    var filteredMembers: [GroupMember] {
        guard !searchQuery.isEmpty else { return store.members }
        let q = searchQuery.lowercased()
        return store.members.filter { $0.name.lowercased().contains(q) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(store.groupName)
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(Theme.textPrimary)
                    Text("\(store.members.count) member\(store.members.count != 1 ? "s" : "") · \(store.members.filter { $0.status == .ready }.count) ready")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(.bottom, 12)

                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.textMuted)
                    TextField("Search members by name...", text: $searchQuery)
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
                .padding(.bottom, 4)

                ForEach(filteredMembers) { member in
                    NavigationLink(value: NavRoute.memberDetail(member.id)) {
                        memberCard(member)
                    }
                    .buttonStyle(.plain)
                }

                if filteredMembers.isEmpty && !store.members.isEmpty {
                    EmptyStateView(icon: "magnifyingglass", title: "No members found", subtitle: "Try a different search term")
                }

                if store.members.isEmpty {
                    EmptyStateView(icon: "person.2.fill", title: "No members yet", subtitle: "Add your group members to track readiness")
                }
            }
            .padding(16)
            .padding(.bottom, 100)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Group Roster")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .bottomTrailing) {
            FAB { showingAddMember = true }
                .padding(20)
        }
        .sheet(isPresented: $showingAddMember) {
            AddMemberView()
        }
    }

    private func memberCard(_ member: GroupMember) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "person.fill")
                .font(.system(size: 20))
                .foregroundStyle(Theme.textPrimary)
                .frame(width: 42, height: 42)
                .background(Theme.oliveMuted)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text(member.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Circle()
                        .fill(member.status.color)
                        .frame(width: 8, height: 8)
                }
                Text(member.role)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textSecondary)
                if !member.skills.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(member.skills.prefix(3), id: \.self) { skill in
                            Text(skill)
                                .font(.system(size: 10, weight: .semibold))
                                .tracking(0.5)
                                .foregroundStyle(Theme.textSecondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Theme.bgElevated)
                                .clipShape(.rect(cornerRadius: 4))
                        }
                    }
                    .padding(.top, 6)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }
}

struct LibraryView: View {
    @Environment(AppStore.self) var store
    @State private var searchQuery: String = ""
    @State private var selectedCategory: KiwixCategory? = nil
    @State private var viewMode: LibraryMode = .catalog

    enum LibraryMode: String, CaseIterable {
        case catalog, saved
        var label: String { rawValue.capitalized }
    }

    var displayItems: [KiwixResource] {
        let source = viewMode == .catalog ? MockData.kiwixCatalog : store.kiwixLibrary
        var items = source
        if let cat = selectedCategory {
            items = items.filter { $0.category == cat }
        }
        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            items = items.filter {
                $0.title.lowercased().contains(q) ||
                $0.description.lowercased().contains(q) ||
                $0.tags.contains { $0.lowercased().contains(q) }
            }
        }
        return items
    }

    var savedIds: Set<String> {
        Set(store.kiwixLibrary.map { $0.id })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                modeToggle
                searchField
                categoryChips
                ForEach(displayItems) { resource in
                    NavigationLink(value: NavRoute.resourceDetail(resource.id)) {
                        resourceCard(resource)
                    }
                    .buttonStyle(.plain)
                }
                if displayItems.isEmpty {
                    EmptyStateView(icon: "books.vertical.fill", title: "No resources found", subtitle: "Try a different search or category filter")
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Kiwix Library")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var modeToggle: some View {
        HStack(spacing: 0) {
            ForEach(LibraryMode.allCases, id: \.self) { mode in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    withAnimation { viewMode = mode }
                } label: {
                    Text(mode.label)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(viewMode == mode ? .white : Theme.textMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(viewMode == mode ? Theme.orange : Theme.bgCard)
                        .clipShape(.rect(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Theme.bgCard)
        .clipShape(.rect(cornerRadius: 12))
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundStyle(Theme.textMuted)
            TextField("Search resources...", text: $searchQuery)
                .font(.system(size: 14))
                .foregroundStyle(Theme.textPrimary)
        }
        .padding(12)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
    }

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(text: "All", isActive: selectedCategory == nil, activeColor: Theme.orange) {
                    selectedCategory = nil
                }
                ForEach(KiwixCategory.allCases, id: \.self) { cat in
                    FilterChip(text: cat.label, isActive: selectedCategory == cat, activeColor: Theme.orange) {
                        selectedCategory = cat
                    }
                }
            }
        }
    }

    private func resourceCard(_ r: KiwixResource) -> some View {
        let isSaved = savedIds.contains(r.id)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: r.category.iconName)
                    .font(.system(size: 22))
                    .foregroundStyle(r.category.color)
                    .frame(width: 48, height: 48)
                    .background(r.category.color.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 4) {
                    Text(r.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                        .lineLimit(2)
                    Text(r.description)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                        .lineLimit(2)
                }
                Spacer()
            }
            HStack(spacing: 12) {
                HStack(spacing: 4) {
                    Image(systemName: "internaldrive").font(.system(size: 10))
                    Text(r.sizeLabel).font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(Theme.textMuted)
                HStack(spacing: 4) {
                    Image(systemName: "globe").font(.system(size: 10))
                    Text(r.language).font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(Theme.textMuted)
                HStack(spacing: 4) {
                    Image(systemName: "calendar").font(.system(size: 10))
                    Text(r.lastUpdated).font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(Theme.textMuted)
                Spacer()
                Text(r.category.label.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1)
                    .foregroundStyle(r.category.color)
            }
            if !r.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(r.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(Theme.textSecondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Theme.bgElevated)
                                .clipShape(.rect(cornerRadius: 4))
                        }
                    }
                }
            }
            HStack {
                Spacer()
                if isSaved {
                    Button {
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                        store.removeKiwixResource(r.id)
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "heart.fill").font(.system(size: 12))
                            Text("Saved")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.green)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.green.opacity(0.15))
                        .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                } else {
                    Button {
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                        store.saveKiwixResource(r)
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "bookmark.fill").font(.system(size: 12))
                            Text("Save")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.orange)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.orange.opacity(0.15))
                        .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }
}

struct GuidesView: View {
    @State private var selectedCategory: String = "All"

    var categories: [String] {
        var cats = Set(MockData.guides.map { $0.category })
        return ["All"] + cats.sorted()
    }

    var filtered: [Guide] {
        if selectedCategory == "All" { return MockData.guides }
        return MockData.guides.filter { $0.category == selectedCategory }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "book.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(Theme.amberLight)
                    Text("Offline reference cards for emergency scenarios")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(.bottom, 8)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.self) { cat in
                            FilterChip(text: cat, isActive: selectedCategory == cat, activeColor: Theme.olive) {
                                selectedCategory = cat
                            }
                        }
                    }
                }

                ForEach(filtered) { guide in
                    NavigationLink(value: NavRoute.guideDetail(guide.id)) {
                        guideCard(guide)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Field Guides")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func guideCard(_ guide: Guide) -> some View {
        HStack(spacing: 12) {
            Image(systemName: guide.icon)
                .font(.system(size: 22))
                .foregroundStyle(Theme.orange)
                .frame(width: 48, height: 48)
                .background(Theme.orangeMuted)
                .clipShape(.rect(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(guide.category.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(Theme.olive)
                Text(guide.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text(guide.summary)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                    .lineLimit(2)
                Text("\(guide.sections.count) section\(guide.sections.count != 1 ? "s" : "")")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textSecondary)
                    .padding(.top, 2)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }
}
