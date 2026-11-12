import SwiftUI
import UIKit

/// Standard radio report builder — fill the lines, read the transmission
/// preview, then copy, share, or send by SMS.
struct ReportBuilderView: View {
    @Environment(AppStore.self) var store
    @State private var activeId = RadioReports.defs[0].id
    @State private var valuesByReport: [String: [String: String]] = [:]
    @State private var shareText: String?
    @State private var showingCopied = false
    @State private var smsRecipients: [String] = []
    @State private var smsBody = ""
    @State private var showingSmsComposer = false
    @State private var showingSmsNoNumbers = false
    @State private var showingSmsUnavailable = false

    private var def: RadioReportDef {
        RadioReports.def(id: activeId) ?? RadioReports.defs[0]
    }

    private var values: [String: String] {
        valuesByReport[def.id] ?? [:]
    }

    private var filledCount: Int {
        def.fields.filter { !(values[$0.id] ?? "").trimmingCharacters(in: .whitespaces).isEmpty }.count
    }

    private var formattedText: String {
        RadioReports.formatText(def, values: values, groupName: store.groupName)
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    typeSelector

                    VStack(alignment: .leading, spacing: 6) {
                        Text(def.name)
                            .font(.system(size: 16, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(Theme.textPrimary)
                        Text(def.description)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.orangeLight)
                        Text(def.whenToUse)
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 10))
                    .padding(.bottom, 16)

                    ForEach(Array(def.fields.enumerated()), id: \.offset) { idx, field in
                        fieldBlock(index: idx, field: field)
                    }

                    transmissionPreview

                    actionButtons
                }
                .padding(16)
                .padding(.bottom, 40)
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Report Builder")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: Binding(
            get: { shareText != nil },
            set: { if !$0 { shareText = nil } }
        )) {
            if let text = shareText {
                ShareSheet(text: text)
            }
        }
        .sheet(isPresented: $showingSmsComposer) {
            MessageComposer(recipients: smsRecipients, body: smsBody)
        }
        .alert("No Phone Numbers", isPresented: $showingSmsNoNumbers) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Add phone numbers to group members first (Intel → Group Roster).")
        }
        .alert("Messaging Unavailable", isPresented: $showingSmsUnavailable) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("This device cannot send SMS messages.")
        }
        .onChange(of: showingCopied) { _, shown in
            if shown {
                Task { @MainActor in
                    try? await Task.sleep(for: .seconds(1.5))
                    showingCopied = false
                }
            }
        }
    }

    private var typeSelector: some View {
        HStack(spacing: 8) {
            ForEach(RadioReports.defs) { report in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    activeId = report.id
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "dot.radiowaves.left.and.right")
                            .font(.system(size: 11, weight: .bold))
                        Text(report.shortName)
                            .font(.system(size: 12, weight: .heavy))
                            .tracking(1)
                    }
                    .foregroundStyle(activeId == report.id ? .white : Theme.orangeLight)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(activeId == report.id ? Theme.olive : Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(activeId == report.id ? Theme.olive : Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.bottom, 14)
    }

    private func fieldBlock(index: Int, field: RadioReportField) -> some View {
        let binding = Binding<String>(
            get: { values[field.id] ?? "" },
            set: { newValue in
                valuesByReport[def.id, default: [:]][field.id] = newValue
            }
        )

        return VStack(alignment: .leading, spacing: 6) {
            Text("LINE \(index + 1) · \(field.label)")
                .font(.system(size: 10, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Theme.textMuted)
            if let choices = field.choices {
                FlowLayout(spacing: 6) {
                    ForEach(choices, id: \.self) { choice in
                        ChoiceChip(label: choice, isSelected: values[field.id] == choice, color: Theme.olive) {
                            if values[field.id] == choice {
                                valuesByReport[def.id, default: [:]][field.id] = ""
                            } else {
                                valuesByReport[def.id, default: [:]][field.id] = choice
                            }
                        }
                    }
                }
            } else {
                FormTextField(placeholder: field.hint ?? "", text: binding, multiline: field.isMultiline)
            }
        }
        .padding(.bottom, 14)
    }

    private var transmissionPreview: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("TRANSMISSION PREVIEW")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(Theme.textMuted)
                Spacer()
                Text("\(filledCount)/\(def.fields.count) LINES")
                    .font(.system(size: 9, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(Theme.orangeLight)
            }
            ForEach(Array(formattedText.split(separator: "\n", omittingEmptySubsequences: false).enumerated()), id: \.offset) { _, line in
                Text(String(line))
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Theme.textPrimary)
                    .lineSpacing(3)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.borderLight, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
        .padding(.top, 8)
    }

    private var actionButtons: some View {
        HStack(spacing: 8) {
            actionButton(icon: showingCopied ? "checkmark" : "doc.on.doc", label: showingCopied ? "COPIED" : "COPY") {
                UIPasteboard.general.string = formattedText
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                showingCopied = true
            }
            actionButton(icon: "square.and.arrow.up", label: "SHARE") {
                shareText = formattedText
            }
            actionButton(icon: "message.fill", label: "SMS") {
                sendBySms()
            }
        }
        .padding(.top, 16)
    }

    private func actionButton(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button {
            action()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 13, weight: .bold))
                Text(label).font(.system(size: 12, weight: .heavy)).tracking(1)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(Theme.olive)
            .clipShape(.rect(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }

    private func sendBySms() {
        let numbers = store.members.compactMap { $0.phone }.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !numbers.isEmpty else {
            showingSmsNoNumbers = true
            return
        }
        smsRecipients = numbers
        smsBody = formattedText
        if SmsService.canSend {
            showingSmsComposer = true
        } else if !SmsService.openViaUrl(recipients: numbers, body: smsBody) {
            showingSmsUnavailable = true
        }
    }
}
