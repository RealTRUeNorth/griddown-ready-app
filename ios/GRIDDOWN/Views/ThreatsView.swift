import SwiftUI

/// Pill-style single-choice button used by the register and equipment forms.
struct ChoiceChip: View {
    let label: String
    let isSelected: Bool
    var color: Color = Theme.orange
    let action: () -> Void

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        } label: {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(isSelected ? .white : Theme.textSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? color : Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(isSelected ? color : Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

/// Threat & hazard register — triage local hazards by likelihood × impact,
/// pin them to the map, and raise the group alert level when one goes active.
struct ThreatsView: View {
    @Environment(AppStore.self) var store
    @State private var sortBySeverity = true
    @State private var editingThreat: Threat?
    @State private var showingAddThreat = false
    @State private var showingPinConfirmation = false
    @State private var pinnedThreatName = ""

    private var sortedThreats: [Threat] {
        let list = store.threats
        return list.sorted { a, b in
            if sortBySeverity {
                if a.severity.rank != b.severity.rank {
                    return a.severity.rank > b.severity.rank
                }
            }
            return a.updatedAt > b.updatedAt
        }
    }

    private var activeCount: Int {
        store.threats.filter { $0.status == .active }.count
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: "shield.lefthalf.filled")
                            .font(.system(size: 14))
                            .foregroundStyle(activeCount > 0 ? Theme.statusRed : Theme.oliveLight)
                        Text("\(store.threats.count) tracked · \(activeCount > 0 ? "\(activeCount) active" : "none active")")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                    }
                    Spacer()
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        sortBySeverity.toggle()
                    } label: {
                        Text(sortBySeverity ? "BY SEVERITY" : "BY RECENT")
                            .font(.system(size: 9, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(Theme.textMuted)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Theme.bgCard)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.border, lineWidth: 1))
                            .clipShape(.rect(cornerRadius: 6))
                    }
                    .buttonStyle(.plain)
                }

                if store.threats.isEmpty {
                    emptyState
                }

                ForEach(sortedThreats) { threat in
                    ThreatCard(
                        threat: threat,
                        onEdit: { editingThreat = threat },
                        onPin: { pinToMap(threat) },
                        onRaise: { raiseAlert(threat) },
                        onDelete: { store.removeThreat(threat.id) }
                    )
                }

                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    showingAddThreat = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                        Text("ADD THREAT")
                            .font(.system(size: 13, weight: .heavy))
                            .tracking(1)
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Theme.orange)
                    .clipShape(.rect(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Threat Register")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAddThreat) {
            AddThreatView()
        }
        .sheet(item: $editingThreat) { threat in
            AddThreatView(existing: threat)
        }
        .alert("Pinned to Map", isPresented: $showingPinConfirmation) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("\"\(pinnedThreatName)\" is now a hazard marker on the Map tab.")
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "bolt.fill")
                .font(.system(size: 30))
                .foregroundStyle(Theme.textMuted)
            Text("No threats tracked yet")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
            Text("Log local hazards — flood zones, storm seasons, unsafe areas — and triage them here.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
    }

    private func pinToMap(_ threat: Threat) {
        guard let coordinates = threat.coordinates else { return }
        store.addPoi(POI(
            id: "poi-threat-\(threat.id)-\(Int(Date().timeIntervalSince1970))",
            name: threat.name,
            category: .hazard,
            coordinates: coordinates,
            notes: "Pinned from Threat Register. \(threat.notes ?? "")".trimmingCharacters(in: .whitespaces),
            createdAt: ISO8601DateFormatter().string(from: Date())
        ))
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        pinnedThreatName = threat.name
        showingPinConfirmation = true
    }

    private func raiseAlert(_ threat: Threat) {
        let target: AlertLevel = threat.severity == .high ? .red : .amber
        let order: [AlertLevel] = [.green, .amber, .red]
        guard order.firstIndex(of: store.alertLevel) ?? 0 < order.firstIndex(of: target) ?? 0 else {
            return
        }
        store.updateAlertLevel(target)
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}

private struct ThreatCard: View {
    let threat: Threat
    let onEdit: () -> Void
    let onPin: () -> Void
    let onRaise: () -> Void
    let onDelete: () -> Void

    private var severityColor: Color {
        switch threat.severity {
        case .high: Theme.statusRed
        case .medium: Theme.statusAmber
        case .low: Theme.statusGreen
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            Rectangle()
                .fill(severityColor)
                .frame(width: 4)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(threat.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                        .lineLimit(1)
                    Spacer()
                    Text(threat.severity.rawValue.uppercased())
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(1)
                        .foregroundStyle(severityColor)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(severityColor.opacity(0.13))
                        .clipShape(.rect(cornerRadius: 5))
                }
                Text("\(threat.category.label) · L: \(threat.likelihood.rawValue) · I: \(threat.impact.rawValue) · \(threat.status.label)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.textMuted)
                if let notes = threat.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                        .lineSpacing(3)
                        .lineLimit(3)
                }
                HStack(spacing: 6) {
                    chip(icon: "pencil", text: "EDIT", color: Theme.textSecondary, action: onEdit)
                    if threat.coordinates != nil {
                        chip(icon: "mappin", text: "PIN TO MAP", color: Theme.orangeLight, action: onPin)
                    }
                    if threat.status == .active {
                        chip(icon: "arrow.up", text: "RAISE ALERT", color: Theme.statusRed, action: onRaise)
                    }
                    Spacer()
                    chip(icon: "trash", text: "", color: Theme.statusRed, action: onDelete)
                }
                .padding(.top, 4)
            }
            .padding(14)
        }
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(
            threat.status == .active ? Theme.statusRed : Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private func chip(icon: String, text: String, color: Color, action: @escaping () -> Void) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        } label: {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .bold))
                if !text.isEmpty {
                    Text(text)
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(0.5)
                }
            }
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(Theme.bgElevated)
            .clipShape(.rect(cornerRadius: 6))
        }
        .buttonStyle(.plain)
    }
}

/// Add / edit form for a threat. Presented as a sheet from the register.
struct AddThreatView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    let existing: Threat?

    init(existing: Threat? = nil) {
        self.existing = existing
    }

    @State private var name: String = ""
    @State private var category: ThreatCategory = .natural
    @State private var likelihood: ThreatLevel = .medium
    @State private var impact: ThreatLevel = .medium
    @State private var status: ThreatStatus = .monitoring
    @State private var notes: String = ""
    @State private var latInput: String = ""
    @State private var lngInput: String = ""
    @State private var loaded = false

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(
                        icon: "shield.lefthalf.filled",
                        iconColor: Theme.redLight,
                        iconBg: Theme.redMuted,
                        title: existing == nil ? "New Threat" : "Edit Threat",
                        subtitle: "Triage a local hazard by likelihood and impact"
                    )

                    FormFieldLabel(text: "NAME")
                    FormTextField(placeholder: "e.g. Flash flooding on Route 9", text: $name)

                    FormFieldLabel(text: "CATEGORY")
                    FlowLayout(spacing: 8) {
                        ForEach(ThreatCategory.allCases, id: \.self) { cat in
                            ChoiceChip(label: cat.label, isSelected: category == cat) {
                                category = cat
                            }
                        }
                    }

                    FormFieldLabel(text: "LIKELIHOOD")
                    FlowLayout(spacing: 8) {
                        ForEach(ThreatLevel.allCases, id: \.self) { level in
                            ChoiceChip(label: level.rawValue.uppercased(), isSelected: likelihood == level) {
                                likelihood = level
                            }
                        }
                    }

                    FormFieldLabel(text: "IMPACT")
                    FlowLayout(spacing: 8) {
                        ForEach(ThreatLevel.allCases, id: \.self) { level in
                            ChoiceChip(label: level.rawValue.uppercased(), isSelected: impact == level) {
                                impact = level
                            }
                        }
                    }

                    FormFieldLabel(text: "STATUS")
                    FlowLayout(spacing: 8) {
                        ForEach(ThreatStatus.allCases, id: \.self) { st in
                            ChoiceChip(label: st.label.uppercased(), isSelected: status == st) {
                                status = st
                            }
                        }
                    }

                    FormFieldLabel(text: "LOCATION (OPTIONAL — FOR MAP PIN)")
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Lat").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                            FormTextField(placeholder: "38.6270", text: $latInput, keyboardType: .numbersAndPunctuation)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Lng").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                            FormTextField(placeholder: "-90.1994", text: $lngInput, keyboardType: .numbersAndPunctuation)
                        }
                    }

                    FormFieldLabel(text: "NOTES (OPTIONAL)")
                    FormTextField(
                        placeholder: "Mitigations, watch conditions, who monitors it...",
                        text: $notes,
                        multiline: true
                    )

                    FormSaveButton(title: existing == nil ? "Add Threat" : "Save Changes", color: Theme.olive, enabled: canSave) {
                        save()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg)
            .navigationTitle(existing == nil ? "Add Threat" : "Edit Threat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                guard !loaded else { return }
                loaded = true
                if let t = existing {
                    name = t.name
                    category = t.category
                    likelihood = t.likelihood
                    impact = t.impact
                    status = t.status
                    notes = t.notes ?? ""
                    if let c = t.coordinates {
                        latInput = String(format: "%.5f", c.latitude)
                        lngInput = String(format: "%.5f", c.longitude)
                    }
                }
            }
        }
    }

    private func save() {
        let lat = Double(latInput.trimmingCharacters(in: .whitespaces))
        let lng = Double(lngInput.trimmingCharacters(in: .whitespaces))
        let coordinates: Coordinates? = (lat != nil && lng != nil) ? Coordinates(latitude: lat!, longitude: lng!) : nil
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedNotes = notes.trimmingCharacters(in: .whitespaces)
        let threat = Threat(
            id: existing?.id ?? "threat_\(Int(Date().timeIntervalSince1970))",
            name: trimmedName,
            category: category,
            likelihood: likelihood,
            impact: impact,
            status: status,
            notes: trimmedNotes.isEmpty ? nil : trimmedNotes,
            coordinates: coordinates,
            createdAt: existing?.createdAt ?? ISO8601DateFormatter().string(from: Date()),
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        if existing != nil {
            store.updateThreat(threat)
        } else {
            store.addThreat(threat)
        }
        dismiss()
    }
}
