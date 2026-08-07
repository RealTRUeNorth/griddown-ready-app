import SwiftUI

// MARK: - Shared Form Components

struct FormFieldLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .tracking(1.5)
            .foregroundStyle(Theme.textMuted)
            .padding(.top, 14)
            .padding(.bottom, 6)
    }
}

struct FormTextField: View {
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var multiline: Bool = false

    var body: some View {
        let field = TextField(placeholder, text: $text, axis: multiline ? .vertical : .horizontal)
            .font(.system(size: 15))
            .foregroundStyle(Theme.textPrimary)
            .keyboardType(keyboardType)
        Group {
            if multiline {
                field.lineLimit(3...6)
            } else {
                field
            }
        }
        .padding(14)
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 10))
    }
}

struct FormSaveButton: View {
    let title: String
    let color: Color
    let enabled: Bool
    let action: () -> Void

    var body: some View {
        Button {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            action()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "checkmark")
                    .font(.system(size: 16, weight: .bold))
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .tracking(1.5)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(enabled ? color : color.opacity(0.4))
            .clipShape(.rect(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .padding(.top, 28)
    }
}

struct FormHeader: View {
    let icon: String
    let iconColor: Color
    let iconBg: Color
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(iconColor)
                .frame(width: 52, height: 52)
                .background(iconBg)
                .clipShape(Circle())
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Theme.textPrimary)
            Text(subtitle)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 12)
    }
}

// MARK: - Add Member

struct AddMemberView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var role: String = ""
    @State private var status: MemberStatus = .unknown
    @State private var skillsText: String = ""
    @State private var phone: String = ""
    @State private var notes: String = ""
    @FocusState private var focused: Bool

    var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "person.crop.circle.badge.plus", iconColor: Theme.orange,
                               iconBg: Theme.orangeMuted, title: "Add Group Member", subtitle: "Register a new member in your roster")

                    FormFieldLabel(text: "NAME *")
                    FormTextField(placeholder: "Member name or callsign", text: $name)
                        .focused($focused)

                    FormFieldLabel(text: "ROLE")
                    FormTextField(placeholder: "e.g. Medic, Scout, Leader", text: $role)

                    FormFieldLabel(text: "STATUS")
                    HStack(spacing: 8) {
                        ForEach(MemberStatus.allCases, id: \.self) { opt in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                status = opt
                            } label: {
                                HStack(spacing: 6) {
                                    Circle().fill(opt.color).frame(width: 8, height: 8)
                                    Text(opt.label)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(status == opt ? Theme.textPrimary : Theme.textSecondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(status == opt ? opt.color.opacity(0.15) : Theme.bgCard)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(status == opt ? opt.color : Theme.border, lineWidth: 1))
                                .clipShape(.rect(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    FormFieldLabel(text: "SKILLS")
                    FormTextField(placeholder: "Comma-separated (e.g. First Aid, Navigation)", text: $skillsText)

                    FormFieldLabel(text: "PHONE")
                    FormTextField(placeholder: "Optional", text: $phone, keyboardType: .phonePad)

                    FormFieldLabel(text: "NOTES")
                    FormTextField(placeholder: "Additional notes", text: $notes, multiline: true)

                    FormSaveButton(title: "ADD MEMBER", color: Theme.orange, enabled: canSave) {
                        let member = GroupMember(
                            id: "m_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces),
                            role: role.trimmingCharacters(in: .whitespaces).isEmpty ? "Member" : role.trimmingCharacters(in: .whitespaces),
                            skills: skillsText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty },
                            status: status,
                            phone: phone.trimmingCharacters(in: .whitespaces).isEmpty ? nil : phone.trimmingCharacters(in: .whitespaces),
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces)
                        )
                        store.addMember(member)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .onAppear { focused = true }
    }
}

// MARK: - Add Supply

struct AddSupplyView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var category: SupplyCategory = .other
    @State private var quantityText: String = ""
    @State private var unit: String = ""
    @State private var minQuantityText: String = ""
    @State private var expirationDate: String = ""
    @State private var notes: String = ""

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        Int(quantityText) != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "shippingbox.fill", iconColor: Theme.orange,
                               iconBg: Theme.orangeMuted, title: "Add Supply Item", subtitle: "Track inventory quantities and alerts")

                    FormFieldLabel(text: "ITEM NAME *")
                    FormTextField(placeholder: "e.g. Bottled Water, MRE, Bandages", text: $name)

                    FormFieldLabel(text: "CATEGORY")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: 8)], spacing: 8) {
                        ForEach(SupplyCategory.allCases, id: \.self) { cat in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                category = cat
                            } label: {
                                Text(cat.label)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(category == cat ? .white : Theme.textSecondary)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(category == cat ? Theme.orange : Theme.bgCard)
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(category == cat ? Theme.orange : Theme.border, lineWidth: 1))
                                    .clipShape(.rect(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "QUANTITY *")
                            FormTextField(placeholder: "0", text: $quantityText, keyboardType: .numberPad)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "UNIT")
                            FormTextField(placeholder: "gallons, lbs", text: $unit)
                        }
                    }

                    FormFieldLabel(text: "MINIMUM QUANTITY (alert threshold)")
                    FormTextField(placeholder: "0", text: $minQuantityText, keyboardType: .numberPad)

                    FormFieldLabel(text: "EXPIRATION DATE")
                    FormTextField(placeholder: "e.g. 2026-12", text: $expirationDate)

                    FormFieldLabel(text: "NOTES")
                    FormTextField(placeholder: "Location, brand, or other details", text: $notes, multiline: true)

                    FormSaveButton(title: "ADD ITEM", color: Theme.orange, enabled: canSave) {
                        let qty = Int(quantityText) ?? 0
                        let item = SupplyItem(
                            id: "s_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces),
                            category: category,
                            quantity: qty,
                            unit: unit.trimmingCharacters(in: .whitespaces).isEmpty ? "units" : unit.trimmingCharacters(in: .whitespaces),
                            minimumQuantity: Int(minQuantityText) ?? 0,
                            expirationDate: expirationDate.trimmingCharacters(in: .whitespaces).isEmpty ? nil : expirationDate.trimmingCharacters(in: .whitespaces),
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces)
                        )
                        store.addSupply(item)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add Supply")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }
}

// MARK: - Add POI

struct AddPoiView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var category: POICategory = .rallyPoint
    @State private var latText: String = ""
    @State private var lngText: String = ""
    @State private var notes: String = ""

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        Double(latText) != nil && Double(lngText) != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "mappin.circle.fill", iconColor: Theme.orange,
                               iconBg: Theme.orangeMuted, title: "New Point of Interest", subtitle: "Mark a location on the tactical map")

                    FormFieldLabel(text: "NAME *")
                    FormTextField(placeholder: "e.g. Water Tower, Safe House...", text: $name)

                    FormFieldLabel(text: "CATEGORY")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
                        ForEach(POICategory.allCases, id: \.self) { cat in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                category = cat
                            } label: {
                                HStack(spacing: 5) {
                                    Image(systemName: cat.iconName).font(.system(size: 11))
                                    Text(cat.label).font(.system(size: 11, weight: .semibold))
                                }
                                .foregroundStyle(category == cat ? .white : Theme.textSecondary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background(category == cat ? cat.color : Theme.bgCard)
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(category == cat ? cat.color : Theme.border, lineWidth: 1))
                                .clipShape(.rect(cornerRadius: 20))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    FormFieldLabel(text: "COORDINATES")
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Lat").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                            FormTextField(placeholder: "39.8283", text: $latText, keyboardType: .numbersAndPunctuation)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Lng").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                            FormTextField(placeholder: "-98.5795", text: $lngText, keyboardType: .numbersAndPunctuation)
                        }
                    }

                    FormFieldLabel(text: "NOTES (OPTIONAL)")
                    FormTextField(placeholder: "Additional details...", text: $notes, multiline: true)

                    FormSaveButton(title: "Add Point of Interest", color: Theme.orange, enabled: canSave) {
                        guard let lat = Double(latText), let lng = Double(lngText) else { return }
                        let poi = POI(
                            id: "poi_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces),
                            category: category,
                            coordinates: Coordinates(latitude: lat, longitude: lng),
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces),
                            createdAt: ISO8601DateFormatter().string(from: Date())
                        )
                        store.addPoi(poi)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add POI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }
}

// MARK: - Add Route

struct AddRouteView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var selectedColorIndex: Int = 0
    @State private var notes: String = ""
    @State private var waypoints: [Coordinates] = []
    @State private var latInput: String = ""
    @State private var lngInput: String = ""

    private let colors = MockData.routeColors

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && waypoints.count >= 2
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "route", iconColor: Theme.oliveLight,
                               iconBg: Theme.oliveMuted, title: "New Route", subtitle: "Define a path with waypoints")

                    FormFieldLabel(text: "NAME")
                    FormTextField(placeholder: "e.g. Bug-Out Route Alpha...", text: $name)

                    FormFieldLabel(text: "ROUTE COLOR")
                    FlowLayout(spacing: 10) {
                        ForEach(Array(colors.enumerated()), id: \.offset) { idx, hex in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                selectedColorIndex = idx
                            } label: {
                                ZStack {
                                    Circle().fill(Color(hexString: hex) ?? Theme.orange)
                                        .frame(width: 36, height: 36)
                                    if idx == selectedColorIndex {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundStyle(.white)
                                    }
                                }
                                .overlay(Circle().stroke(idx == selectedColorIndex ? .white : .clear, lineWidth: 3))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    HStack(spacing: 4) {
                        Text("WAYPOINTS (\(waypoints.count))")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundStyle(Theme.textMuted)
                        if waypoints.count < 2 {
                            Text("— need at least 2")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Theme.statusAmber)
                        }
                        Spacer()
                    }
                    .padding(.top, 14)
                    .padding(.bottom, 6)

                    ForEach(Array(waypoints.enumerated()), id: \.offset) { idx, wp in
                        HStack(spacing: 10) {
                            ZStack {
                                Circle().fill(Color(hexString: colors[selectedColorIndex]) ?? Theme.orange)
                                    .frame(width: 24, height: 24)
                                Text("\(idx + 1)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                            Text(String(format: "%.5f, %.5f", wp.latitude, wp.longitude))
                                .font(.system(size: 12, weight: .medium, design: .monospaced))
                                .foregroundStyle(Theme.textSecondary)
                            Spacer()
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                waypoints.remove(at: idx)
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Theme.statusRed)
                                    .padding(4)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Theme.bgCard)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
                        .clipShape(.rect(cornerRadius: 8))
                        .padding(.bottom, 6)
                    }

                    VStack(spacing: 10) {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Lat").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                                FormTextField(placeholder: "39.8283", text: $latInput, keyboardType: .numbersAndPunctuation)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Lng").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                                FormTextField(placeholder: "-98.5795", text: $lngInput, keyboardType: .numbersAndPunctuation)
                            }
                        }
                        Button {
                            addWaypoint()
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "plus").font(.system(size: 14, weight: .bold))
                                Text("Add Waypoint").font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundStyle(Theme.textPrimary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Theme.bgElevated)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderLight, lineWidth: 1))
                            .clipShape(.rect(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(12)
                    .background(Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 10))
                    .padding(.bottom, 6)

                    FormFieldLabel(text: "NOTES (OPTIONAL)")
                    FormTextField(placeholder: "Route details, hazards, landmarks...", text: $notes, multiline: true)

                    FormSaveButton(title: "Create Route", color: Theme.olive, enabled: canSave) {
                        let route = Route(
                            id: "route_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces),
                            color: colors[selectedColorIndex],
                            waypoints: waypoints,
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces),
                            createdAt: ISO8601DateFormatter().string(from: Date())
                        )
                        store.addRoute(route)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }

    private func addWaypoint() {
        guard let lat = Double(latInput), let lng = Double(lngInput) else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        waypoints.append(Coordinates(latitude: lat, longitude: lng))
        latInput = ""
        lngInput = ""
    }
}

// MARK: - Add Channel

struct AddChannelView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var band: CommsBand = .FRS
    @State private var frequency: String = ""
    @State private var mode: CommsMode = .simplex
    @State private var purpose: String = ""
    @State private var ctcssTone: String = ""
    @State private var power: String = ""
    @State private var notes: String = ""
    @State private var isPrimary: Bool = false

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        !frequency.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "antenna.radiowaves.left.and.right", iconColor: Theme.orange,
                               iconBg: Theme.orangeMuted, title: "Add Comms Channel", subtitle: "Define a frequency for group communications")

                    FormFieldLabel(text: "CHANNEL NAME *")
                    FormTextField(placeholder: "e.g. PRIMARY, TACTICAL-1", text: $name)

                    FormFieldLabel(text: "BAND")
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(CommsBand.allCases, id: \.self) { b in
                                Button {
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    band = b
                                } label: {
                                    Text(b.rawValue.replacingOccurrences(of: "_", with: " "))
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(band == b ? b.color : Theme.textSecondary)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(band == b ? b.color.opacity(0.2) : Theme.bgCard)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(band == b ? b.color : Theme.border, lineWidth: 1))
                                        .clipShape(.rect(cornerRadius: 6))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    FormFieldLabel(text: "FREQUENCY *")
                    FormTextField(placeholder: "e.g. 462.5625 MHz", text: $frequency)

                    FormFieldLabel(text: "MODE")
                    HStack(spacing: 6) {
                        ForEach(CommsMode.allCases, id: \.self) { m in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                mode = m
                            } label: {
                                Text(m.label.uppercased())
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(mode == m ? Theme.orange : Theme.textSecondary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(mode == m ? Theme.orangeMuted : Theme.bgCard)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(mode == m ? Theme.orange : Theme.border, lineWidth: 1))
                                    .clipShape(.rect(cornerRadius: 6))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    FormFieldLabel(text: "PURPOSE")
                    FormTextField(placeholder: "e.g. Main group communications", text: $purpose)

                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "CTCSS TONE")
                            FormTextField(placeholder: "e.g. 141.3 Hz", text: $ctcssTone)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "POWER")
                            FormTextField(placeholder: "e.g. 2W", text: $power)
                        }
                    }

                    FormFieldLabel(text: "NOTES")
                    FormTextField(placeholder: "Additional notes...", text: $notes, multiline: true)

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Primary Channel")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(Theme.textPrimary)
                            Text("Mark as your group's primary frequency")
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.textMuted)
                        }
                        Spacer()
                        Toggle("", isOn: $isPrimary).tint(Theme.statusGreen).labelsHidden()
                    }
                    .padding(14)
                    .background(Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 10))
                    .padding(.top, 16)

                    FormSaveButton(title: "ADD CHANNEL", color: Theme.orange, enabled: canSave) {
                        let channel = CommsChannel(
                            id: "ch_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces).uppercased(),
                            band: band,
                            frequency: frequency.trimmingCharacters(in: .whitespaces),
                            mode: mode,
                            purpose: purpose.trimmingCharacters(in: .whitespaces),
                            ctcssTone: ctcssTone.trimmingCharacters(in: .whitespaces).isEmpty ? nil : ctcssTone.trimmingCharacters(in: .whitespaces),
                            power: power.trimmingCharacters(in: .whitespaces).isEmpty ? nil : power.trimmingCharacters(in: .whitespaces),
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces),
                            isPrimary: isPrimary
                        )
                        store.addCommsChannel(channel)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add Channel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }
}

// MARK: - Add Repeater

struct AddRepeaterView: View {
    @Environment(AppStore.self) var store
    @Environment(\.dismiss) var dismiss

    @State private var name: String = ""
    @State private var inputFreq: String = ""
    @State private var outputFreq: String = ""
    @State private var offset: String = ""
    @State private var ctcssTone: String = ""
    @State private var location: String = ""
    @State private var range: String = ""
    @State private var notes: String = ""

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        !inputFreq.trimmingCharacters(in: .whitespaces).isEmpty &&
        !outputFreq.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    FormHeader(icon: "tower.signal", iconColor: Theme.orange,
                               iconBg: Theme.orangeMuted, title: "Add Repeater", subtitle: "Register a repeater station to extend comms range")

                    FormFieldLabel(text: "REPEATER NAME *")
                    FormTextField(placeholder: "e.g. HILLTOP-1, VALLEY-RPT", text: $name)

                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "INPUT FREQ *")
                            FormTextField(placeholder: "462.5500 MHz", text: $inputFreq)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "OUTPUT FREQ *")
                            FormTextField(placeholder: "467.5500 MHz", text: $outputFreq)
                        }
                    }

                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "OFFSET")
                            FormTextField(placeholder: "+5.0 MHz", text: $offset)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            FormFieldLabel(text: "CTCSS TONE")
                            FormTextField(placeholder: "103.5 Hz", text: $ctcssTone)
                        }
                    }

                    FormFieldLabel(text: "LOCATION")
                    FormTextField(placeholder: "e.g. Ridge Point Elevation 1240ft", text: $location)

                    FormFieldLabel(text: "ESTIMATED RANGE")
                    FormTextField(placeholder: "e.g. ~15 mi radius", text: $range)

                    FormFieldLabel(text: "NOTES")
                    FormTextField(placeholder: "Power source, access info, etc.", text: $notes, multiline: true)

                    FormSaveButton(title: "ADD REPEATER", color: Theme.orange, enabled: canSave) {
                        let repeater = CommsRepeater(
                            id: "rpt_\(Int(Date().timeIntervalSince1970))",
                            name: name.trimmingCharacters(in: .whitespaces).uppercased(),
                            inputFreq: inputFreq.trimmingCharacters(in: .whitespaces),
                            outputFreq: outputFreq.trimmingCharacters(in: .whitespaces),
                            offset: offset.trimmingCharacters(in: .whitespaces).isEmpty ? "N/A" : offset.trimmingCharacters(in: .whitespaces),
                            ctcssTone: ctcssTone.trimmingCharacters(in: .whitespaces).isEmpty ? "None" : ctcssTone.trimmingCharacters(in: .whitespaces),
                            location: location.trimmingCharacters(in: .whitespaces).isEmpty ? nil : location.trimmingCharacters(in: .whitespaces),
                            range: range.trimmingCharacters(in: .whitespaces).isEmpty ? nil : range.trimmingCharacters(in: .whitespaces),
                            notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces)
                        )
                        store.addCommsRepeater(repeater)
                        dismiss()
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Add Repeater")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }
}
