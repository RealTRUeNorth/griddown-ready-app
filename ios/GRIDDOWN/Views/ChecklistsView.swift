import SwiftUI

struct ChecklistsView: View {
    @Environment(AppStore.self) var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("Track your preparedness across \(store.checklists.count) checklists")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
                    .padding(.bottom, 8)

                ForEach(store.checklists) { cl in
                    if let stat = store.checklistStats(for: cl.id) {
                        NavigationLink(value: NavRoute.checklistDetail(cl.id)) {
                            checklistCard(cl, stat: stat)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Checklists")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func checklistCard(_ cl: Checklist, stat: (completed: Int, total: Int, percent: Int)) -> some View {
        let isComplete = stat.percent == 100
        return HStack(spacing: 12) {
            Image(systemName: cl.icon)
                .font(.system(size: 22))
                .foregroundStyle(Theme.orange)
                .frame(width: 46, height: 46)
                .background(Theme.orangeMuted)
                .clipShape(.rect(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 2) {
                Text(cl.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text(cl.description)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                HStack(spacing: 8) {
                    ProgressBar(percent: stat.percent)
                    Text("\(stat.completed)/\(stat.total)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(.top, 8)
            }
            Spacer()
            Image(systemName: isComplete ? "checkmark.circle.fill" : "chevron.right")
                .font(.system(size: 20))
                .foregroundStyle(isComplete ? Theme.statusGreen : Theme.textMuted)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
        .padding(.bottom, 10)
    }
}
