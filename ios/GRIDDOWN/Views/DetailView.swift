import SwiftUI

struct ChecklistDetailView: View {
    let checklist: Checklist
    @Environment(AppStore.self) var store

    var stats: (completed: Int, total: Int, percent: Int) {
        store.checklistStats(for: checklist.id) ?? (0, 0, 0)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: checklist.icon)
                            .font(.system(size: 28))
                            .foregroundStyle(Theme.orange)
                            .frame(width: 56, height: 56)
                            .background(Theme.orangeMuted)
                            .clipShape(.rect(cornerRadius: 14))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(checklist.title)
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(Theme.textPrimary)
                            Text(checklist.description)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                    HStack(spacing: 8) {
                        ProgressBar(percent: stats.percent)
                        Text("\(stats.completed)/\(stats.total)")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 14))

                SectionLabel(text: "ITEMS")

                ForEach(checklist.items) { item in
                    checklistItemRow(item)
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(checklist.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func checklistItemRow(_ item: ChecklistItem) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            store.toggleChecklistItem(checklistId: checklist.id, itemId: item.id)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: item.completed ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundStyle(item.completed ? Theme.statusGreen : Theme.textMuted)
                Text(item.text)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(item.completed ? Theme.textSecondary : Theme.textPrimary)
                    .strikethrough(item.completed)
                    .multilineTextAlignment(.leading)
                Spacer()
            }
            .padding(14)
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 10))
        }
        .buttonStyle(.plain)
        .padding(.bottom, 6)
    }
}

struct GuideDetailView: View {
    let guide: Guide

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: guide.icon)
                        .font(.system(size: 32))
                        .foregroundStyle(Theme.orange)
                        .frame(width: 60, height: 60)
                        .background(Theme.orangeMuted)
                        .clipShape(.rect(cornerRadius: 16))
                    Text(guide.category.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(Theme.olive)
                    Text(guide.title)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Text(guide.summary)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 14))

                ForEach(Array(guide.sections.enumerated()), id: \.offset) { idx, section in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Text("\(idx + 1)")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Theme.orange)
                                .frame(width: 28, height: 28)
                                .background(Theme.orange.opacity(0.15))
                                .clipShape(Circle())
                            Text(section.title)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(Theme.textPrimary)
                        }
                        Text(section.content)
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(4)
                    }
                    .padding(16)
                    .background(Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 12))
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(guide.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MemberDetailView: View {
    let member: GroupMember

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(spacing: 12) {
                    Image(systemName: "person.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(Theme.textPrimary)
                        .frame(width: 80, height: 80)
                        .background(Theme.oliveMuted)
                        .clipShape(Circle())

                    Text(member.name)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Text(member.role)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)

                    HStack(spacing: 6) {
                        Circle().fill(member.status.color).frame(width: 8, height: 8)
                        Text(member.status.label.uppercased())
                            .font(.system(size: 12, weight: .bold))
                            .tracking(1)
                            .foregroundStyle(member.status.color)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(member.status.color.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 8))
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 14))

                if !member.skills.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: "SKILLS")
                        FlexTagView(tags: member.skills)
                    }
                }

                if let notes = member.notes, !notes.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: "NOTES")
                        Text(notes)
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(4)
                            .padding(16)
                            .background(Theme.bgCard)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                            .clipShape(.rect(cornerRadius: 12))
                    }
                }

                if let phone = member.phone, !phone.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: "CONTACT")
                        HStack(spacing: 10) {
                            Image(systemName: "phone.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(Theme.oliveLight)
                            Text(phone)
                                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                                .foregroundStyle(Theme.textPrimary)
                        }
                        .padding(16)
                        .background(Theme.bgCard)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                        .clipShape(.rect(cornerRadius: 12))
                    }
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(member.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct FlexTagView: View {
    let tags: [String]

    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(tags, id: \.self) { tag in
                Text(tag)
                    .font(.system(size: 12, weight: .semibold))
                    .tracking(0.5)
                    .foregroundStyle(Theme.textSecondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Theme.bgElevated)
                    .clipShape(.rect(cornerRadius: 6))
            }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[LayoutSubviews.Element]] = [[]]
        var currentRowWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentRowWidth + size.width + spacing > maxWidth && !rows[rows.count - 1].isEmpty {
                rows.append([])
                currentRowWidth = 0
            }
            rows[rows.count - 1].append(subview)
            currentRowWidth += size.width + spacing
        }

        var totalHeight: CGFloat = 0
        for row in rows {
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            totalHeight += rowHeight + spacing
        }

        return CGSize(width: maxWidth, height: totalHeight - spacing)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var rows: [[LayoutSubviews.Element]] = [[]]
        var currentRowWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentRowWidth + size.width + spacing > maxWidth && !rows[rows.count - 1].isEmpty {
                rows.append([])
                currentRowWidth = 0
            }
            rows[rows.count - 1].append(subview)
            currentRowWidth += size.width + spacing
        }

        var y = bounds.minY
        for row in rows {
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            var x = bounds.minX
            for subview in row {
                let size = subview.sizeThatFits(.unspecified)
                subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }
}

struct ResourceDetailView: View {
    let resource: KiwixResource
    @Environment(AppStore.self) var store

    var isSaved: Bool {
        store.kiwixLibrary.contains { $0.id == resource.id }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Image(systemName: resource.category.iconName)
                        .font(.system(size: 32))
                        .foregroundStyle(resource.category.color)
                        .frame(width: 60, height: 60)
                        .background(resource.category.color.opacity(0.15))
                        .clipShape(.rect(cornerRadius: 16))
                    Text(resource.title)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Text(resource.description)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                        .lineSpacing(4)
                }
                .padding(16)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 14))

                VStack(alignment: .leading, spacing: 8) {
                    SectionLabel(text: "DETAILS")
                    detailRow("Size", resource.sizeLabel)
                    detailRow("Language", resource.language)
                    detailRow("Updated", resource.lastUpdated)
                    detailRow("Category", resource.category.label)
                }

                if !resource.tags.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: "TAGS")
                        FlexTagView(tags: resource.tags)
                    }
                }

                Button {
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    if isSaved {
                        store.removeKiwixResource(resource.id)
                    } else {
                        store.saveKiwixResource(resource)
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: isSaved ? "heart.fill" : "bookmark.fill")
                        Text(isSaved ? "Saved to Library" : "Save to Library")
                    }
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(isSaved ? Theme.green : Theme.orange)
                    .clipShape(.rect(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(resource.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold))
                .tracking(1)
                .foregroundStyle(Theme.textMuted)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
        .padding(.bottom, 6)
    }
}
