import SwiftUI

/// Armory / serialized equipment inventory — accountable gear tracked
/// separately from consumable supplies.
struct EquipmentView: View {
    @Environment(AppStore.self) var store
    @State private var editingItem: EquipmentItem?
    @State private var showingAdd = false

    private var grouped: [(category: EquipmentCategory, items: [EquipmentItem])] {
        Dictionary(grouping: store.equipment, by: { $0.category })
            .sorted { $0.key.rawValue < $1.key.rawValue }
            .map { (category: $0.key, items: $0.value) }
    }

    private var poorCount: Int {
        store.equipment.filter { $0.condition == .poor }.count
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    Text("\(store.equipment.count) ITEM\(store.equipment.count == 1 ? "" : "S") TRACKED\(poorCount > 0 ? " · \(poorCount) POOR CONDITION" : "")")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(Theme.textMuted)
                    Spacer()
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        showingAdd = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "plus").font(.system(size: 12, weight: .bold))
                            Text("ADD").font(.system(size: 10, weight: .heavy)).tracking(1)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Theme.orange)
                        .clipShape(.rect(cornerRadius: 6))
                    }
                    .buttonStyle(.plain)
                }

                if store.equipment.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "shippingbox")
                            .font(.system(size: 30))
                            .foregroundStyle(Theme.textMuted)
                        Text("No equipment tracked")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                        Text("Track serialized gear, weapons, and accountable kit separately from consumable supplies.")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                }

                ForEach(grouped, id: \.category) { group in
                    Text(group.category.label.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(Theme.textMuted)
                        .padding(.top, 4)

                    ForEach(group.items) { item in
                        EquipmentCard(item: item) {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            editingItem = item
                        }
                    }
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Equipment")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAdd) {
            AddEquipmentView()
        }
        .sheet(item: $editingItem) { item in
            AddEquipmentView(existing: item)
        }
    }
}

private struct EquipmentCard: View {
    let item: EquipmentItem
    let onTap: () -> Void

    private var conditionColor: Color {
        switch item.condition {
        case .new: Theme.statusGreen
        case .good: Theme.oliveLight
        case .fair: Theme.statusAmber
        case .poor: Theme.statusRed
        }
    }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(item.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                        .lineLimit(1)
                    Spacer()
                    Text(item.condition.label.uppercased())
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(1)
                        .foregroundStyle(conditionColor)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(conditionColor.opacity(0.13))
                        .clipShape(.rect(cornerRadius: 5))
                }
                Text("×\(item.quantity)\(item.serial.map { "  ·  SN \($0)" } ?? "")")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundStyle(Theme.orangeLight)
                if item.assignedTo != nil || item.location != nil {
                    HStack(spacing: 12) {
                        if let assigned = item.assignedTo {
                            HStack(spacing: 4) {
                                Image(systemName: "person").font(.system(size: 9))
                                Text(assigned).font(.system(size: 11))
                            }
                            .foregroundStyle(Theme.textSecondary)
                        }
                        if let location = item.location {
                            HStack(spacing: 4) {
                                Image(systemName: "mappin").font(.system(size: 9))
                                Text(location).font(.system(size: 11))
                            }
                            .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
                if let notes = item.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.system(size: 11, weight: .medium))
                        .italic()
                        .foregroundStyle(Theme.textMuted)
                }
                if item.isSample == true {
                    Text("SAMPLE")
                        .font(.system(size: 8, weight: .heavy))
                        .tracking(1)
                        .foregroundStyle(Theme.textMuted)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Theme.bgElevated)
                        .clipShape(.rect(cornerRadius: 3))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .padding(.bottom, 2)
    }
}

/// Add / edit form for an equipment item. Presented as a sheet.
struct AddEquipmentView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    let existing: EquipmentItem?

    init(existing: EquipmentItem? = nil) {
        self.existing = existing
    }

    @State private var name = ""
    @State private var category: EquipmentCategory = .tools
    @State private var quantityText = "1"
    @State private var serial = ""
    @State private var condition: EquipmentCondition = .good
    @State private var assignedTo = ""
    @State private var location = ""
    @State private var notes = ""
    @State private var loaded = false

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(
                        icon: "shippingbox",
                        iconColor: Theme.orangeLight,
                        iconBg: Theme.orangeMuted,
                        title: existing == nil ? "New Equipment" : "Edit Equipment",
                        subtitle: "Serialized gear, weapons, and accountable kit"
                    )

                    FormFieldLabel(text: "NAME")
                    FormTextField(placeholder: "e.g. Berkey Water Filter", text: $name)

                    FormFieldLabel(text: "CATEGORY")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: 8)], spacing: 8) {
                        ForEach(EquipmentCategory.allCases, id: \.self) { cat in
                            ChoiceChip(label: cat.label, isSelected: category == cat) {
                                category = cat
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "QUANTITY")
                            FormTextField(placeholder: "1", text: $quantityText, keyboardType: .numberPad)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "SERIAL (OPTIONAL)")
                            FormTextField(placeholder: "Serial #", text: $serial)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.characters)
                        }
                    }

                    FormFieldLabel(text: "CONDITION")
                    FlowLayout(spacing: 8) {
                        ForEach(EquipmentCondition.allCases, id: \.self) { cond in
                            ChoiceChip(label: cond.label.uppercased(), isSelected: condition == cond) {
                                condition = cond
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "ASSIGNED TO")
                            FormTextField(placeholder: "Member name", text: $assignedTo)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "STORED AT")
                            FormTextField(placeholder: "e.g. Safe, garage", text: $location)
                        }
                    }

                    FormFieldLabel(text: "NOTES (OPTIONAL)")
                    FormTextField(
                        placeholder: "Maintenance schedule, zeroing, accessories...",
                        text: $notes,
                        multiline: true
                    )

                    FormSaveButton(title: existing == nil ? "Add Equipment" : "Save Changes", color: Theme.olive, enabled: canSave) {
                        save()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg)
            .navigationTitle(existing == nil ? "Add Equipment" : "Edit Equipment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                if existing != nil && existing?.isSample != true {
                    ToolbarItem(placement: .destructiveAction) {
                        Button(role: .destructive) {
                            store.removeEquipment(existing!.id)
                            dismiss()
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                }
            }
            .onAppear {
                guard !loaded else { return }
                loaded = true
                if let item = existing {
                    name = item.name
                    category = item.category
                    quantityText = String(item.quantity)
                    serial = item.serial ?? ""
                    condition = item.condition
                    assignedTo = item.assignedTo ?? ""
                    location = item.location ?? ""
                    notes = item.notes ?? ""
                }
            }
        }
    }

    private func save() {
        let qty = Int(quantityText) ?? 1
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedSerial = serial.trimmingCharacters(in: .whitespaces)
        let trimmedAssigned = assignedTo.trimmingCharacters(in: .whitespaces)
        let trimmedLocation = location.trimmingCharacters(in: .whitespaces)
        let trimmedNotes = notes.trimmingCharacters(in: .whitespaces)
        let item = EquipmentItem(
            id: existing?.id ?? "equip_\(Int(Date().timeIntervalSince1970))",
            name: trimmedName,
            category: category,
            quantity: max(qty, 1),
            serial: trimmedSerial.isEmpty ? nil : trimmedSerial,
            condition: condition,
            assignedTo: trimmedAssigned.isEmpty ? nil : trimmedAssigned,
            location: trimmedLocation.isEmpty ? nil : trimmedLocation,
            notes: trimmedNotes.isEmpty ? nil : trimmedNotes,
            isSample: existing?.isSample
        )
        if existing != nil {
            store.updateEquipment(item)
        } else {
            store.addEquipment(item)
        }
        dismiss()
    }
}
