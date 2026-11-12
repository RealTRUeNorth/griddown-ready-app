import Foundation

/// Standard military / emergency radio report builders. Each report is a list
/// of labeled lines the user fills in; the formatted output reads
/// line-by-line the way these reports are actually transmitted.
nonisolated struct RadioReportField: Identifiable, Sendable {
    var id: String
    var label: String
    var hint: String?
    /// Fixed choice list — rendered as selectable chips instead of free text.
    var choices: [String]?
    var isMultiline: Bool

    init(
        id: String, label: String, hint: String? = nil,
        choices: [String]? = nil, isMultiline: Bool = false
    ) {
        self.id = id
        self.label = label
        self.hint = hint
        self.choices = choices
        self.isMultiline = isMultiline
    }
}

nonisolated struct RadioReportDef: Identifiable, Sendable {
    var id: String
    var name: String
    var shortName: String
    var description: String
    var whenToUse: String
    var fields: [RadioReportField]
}

nonisolated enum RadioReports {
    static let defs: [RadioReportDef] = [
        RadioReportDef(
            id: "salute", name: "SALUTE", shortName: "SALUTE",
            description: "Report on observed enemy / hostile activity",
            whenToUse: "Use when reporting a sighting of hostile activity, suspicious persons, or a developing threat to your group.",
            fields: [
                RadioReportField(id: "size", label: "S — Size", hint: "Number of personnel / vehicles observed"),
                RadioReportField(id: "activity", label: "A — Activity", hint: "What are they doing?"),
                RadioReportField(id: "location", label: "L — Location", hint: "Address, grid, or landmark"),
                RadioReportField(id: "unit", label: "U — Unit / Appearance", hint: "Uniform, insignia, vehicle type"),
                RadioReportField(id: "time", label: "T — Time", hint: "When observed (local time + date)"),
                RadioReportField(id: "equipment", label: "E — Equipment", hint: "Weapons, comms, vehicles, kit"),
            ]
        ),
        RadioReportDef(
            id: "statrep", name: "STATREP", shortName: "STATREP",
            description: "Group status report to leadership",
            whenToUse: "Use for periodic roll-up of your group's status: personnel, supplies, comms, and next contact.",
            fields: [
                RadioReportField(id: "period", label: "Reporting Period", hint: "e.g. 1200–1800 local"),
                RadioReportField(id: "situation", label: "Situation Summary", isMultiline: true),
                RadioReportField(id: "personnel", label: "Personnel Status", hint: "Accounted for / missing / injured", isMultiline: true),
                RadioReportField(id: "supplies", label: "Supply Status", hint: "Water, food, fuel, medical", isMultiline: true),
                RadioReportField(id: "comms", label: "Comms Status", hint: "Channels monitored, net condition"),
                RadioReportField(id: "next", label: "Next Report", hint: "Time of next scheduled report"),
            ]
        ),
        RadioReportDef(
            id: "nineline", name: "9-LINE MEDEVAC", shortName: "9-LINE",
            description: "Medical evacuation request",
            whenToUse: "Use to organize patient and pickup information before contacting EMS, air ambulance, or a rescue net.",
            fields: [
                RadioReportField(id: "l1", label: "Line 1 — Pickup Location", hint: "Grid coordinates or address"),
                RadioReportField(id: "l2", label: "Line 2 — Frequency / Call Sign", hint: "Channel to reach you on"),
                RadioReportField(id: "l3", label: "Line 3 — Patients by Precedence",
                                 choices: ["A — Urgent", "B — Priority", "C — Routine", "A ×2", "B ×2", "A + B"]),
                RadioReportField(id: "l4", label: "Line 4 — Special Equipment", hint: "Ventilator, stretcher, extraction gear"),
                RadioReportField(id: "l5", label: "Line 5 — Patients by Type", hint: "Litter / ambulatory counts"),
                RadioReportField(id: "l6", label: "Line 6 — Wounds / Security", hint: "Number and type of wounds; site security", isMultiline: true),
                RadioReportField(id: "l7", label: "Line 7 — Site Marking",
                                 choices: ["Smoke", "Strobe / Panel", "Signal Mirror", "Flashlight", "Radio Directed", "None"]),
                RadioReportField(id: "l8", label: "Line 8 — Patient Details", hint: "Nationality / status"),
                RadioReportField(id: "l9", label: "Line 9 — Terrain / Contamination", hint: "Terrain description, HazMat if any", isMultiline: true),
            ]
        ),
    ]

    static func def(id: String) -> RadioReportDef? {
        defs.first(where: { $0.id == id })
    }

    /// Formats a filled report as line-by-line radio text. Empty fields are
    /// sent as "—" so line numbers stay aligned with the standard.
    static func formatText(_ def: RadioReportDef, values: [String: String], groupName: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let dtg = formatter.string(from: Date())
        var lines: [String] = []
        lines.append("[\(def.name.uppercased())] \(groupName) — \(dtg)")
        for (idx, field) in def.fields.enumerated() {
            let shortLabel = field.label.split(separator: "—").first?
                .trimmingCharacters(in: .whitespaces) ?? field.label
            let value = (values[field.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            lines.append("\(idx + 1). \(shortLabel): \(value.isEmpty ? "—" : value)")
        }
        return lines.joined(separator: "\n")
    }
}
