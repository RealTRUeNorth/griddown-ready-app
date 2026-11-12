import SwiftUI

/// Guided area study workbook — a section at a time, autosaving, with a
/// completeness meter and share/print export.
struct AreaStudyView: View {
    @Environment(AppStore.self) var store
    @State private var draftSections: [String: String] = [:]
    @State private var shareText: String?
    @State private var showingExportCopied = false

    private let template = MockData.areaStudyTemplate

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                progressCard

                Text("A complete area study is the foundation of every preparedness plan. Work through each layer of your operational environment — a little at a time is fine.")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(3)
                    .padding(.bottom, 16)

                ForEach(Array(template.enumerated()), id: \.offset) { idx, section in
                    sectionCard(index: idx, section: section)
                }

                Button {
                    exportStudy()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 14, weight: .bold))
                        Text("EXPORT STUDY (SHARE / PRINT)")
                            .font(.system(size: 13, weight: .heavy))
                            .tracking(1)
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Theme.olive)
                    .clipShape(.rect(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .padding(.top, 8)

                HStack(spacing: 6) {
                    Image(systemName: "map")
                        .font(.system(size: 11))
                    Text("Pair this study with POIs and routes pinned on the Map tab.")
                        .font(.system(size: 11))
                }
                .foregroundStyle(Theme.textMuted)
                .frame(maxWidth: .infinity)
                .padding(.top, 16)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Area Study")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadDrafts)
        .sheet(isPresented: Binding(
            get: { shareText != nil },
            set: { if !$0 { shareText = nil } }
        )) {
            if let text = shareText {
                ShareSheet(text: text)
            }
        }
        .alert("Copied", isPresented: $showingExportCopied) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Area study copied to the clipboard.")
        }
    }

    private var progress: (filled: Int, total: Int, percent: Int) {
        store.areaStudyProgress
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("WORKBOOK COMPLETENESS")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(Theme.textMuted)
                Spacer()
                Text("\(progress.percent)%")
                    .font(.system(size: 18, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Theme.orangeLight)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(Theme.bgElevated)
                    Rectangle()
                        .fill(
                            progress.percent == 100 ? Theme.statusGreen :
                            progress.percent > 50 ? Theme.statusAmber : Theme.orange
                        )
                        .frame(width: geo.size.width * CGFloat(progress.percent) / 100)
                }
            }
            .frame(height: 6)
            .clipShape(.rect(cornerRadius: 3))
            Text("\(progress.filled) of \(progress.total) sections written · autosaves as you type")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
        .padding(.bottom, 14)
    }

    private func sectionCard(index: Int, section: (id: String, title: String, prompt: String)) -> some View {
        let content = Binding<String>(
            get: { draftSections[section.id] ?? "" },
            set: { newValue in
                draftSections[section.id] = newValue
                store.updateAreaStudySection(id: section.id, content: newValue)
            }
        )
        let isFilled = !(draftSections[section.id] ?? "").trimmingCharacters(in: .whitespaces).isEmpty

        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Theme.oliveMuted).frame(width: 22, height: 22)
                    Text("\(index + 1)")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(Theme.oliveLight)
                }
                Text(section.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                if isFilled {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.statusGreen)
                }
            }
            Text(section.prompt)
                .font(.system(size: 12))
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(3)
            FormTextField(
                placeholder: section.id == "threats" && !store.threats.isEmpty
                    ? "Tip: you're tracking \(store.threats.count) threats in the Threat Register"
                    : "Write what you know, verify what you don't...",
                text: content,
                multiline: true
            )
            .frame(minHeight: 96)
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
        .padding(.bottom, 12)
    }

    private func loadDrafts() {
        for section in template {
            draftSections[section.id] = store.areaStudy.content(for: section.id)
        }
    }

    private func exportStudy() {
        var lines: [String] = []
        lines.append("AREA STUDY — \(store.groupName)")
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        lines.append("Compiled \(formatter.string(from: Date()))")
        lines.append("")
        for (idx, section) in template.enumerated() {
            lines.append("\(idx + 1). \(section.title.uppercased())")
            let content = store.areaStudy.content(for: section.id)
                .trimmingCharacters(in: .whitespaces)
            for line in (content.isEmpty ? "(not yet completed)" : content).split(separator: "\n") {
                lines.append("   \(line)")
            }
            lines.append("")
        }
        let text = lines.joined(separator: "\n")
        shareText = text
    }
}

/// UIKit share wrapper used by workbook export and report sharing.
struct ShareSheet: UIViewControllerRepresentable {
    let text: String

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [text], applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
