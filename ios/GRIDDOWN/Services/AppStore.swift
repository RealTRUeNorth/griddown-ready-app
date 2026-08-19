import SwiftUI
import Observation

@Observable
final class AppStore {
    var alertLevel: AlertLevel = .green
    var groupName: String = "My Group"
    var members: [GroupMember] = MockData.members
    var supplies: [SupplyItem] = MockData.seedSupplies
    var checklists: [Checklist] = MockData.checklists
    var pois: [POI] = MockData.allSeedPois
    var routes: [Route] = MockData.defaultRoutes
    var commsChannels: [CommsChannel] = MockData.commsChannels
    var commsRepeaters: [CommsRepeater] = MockData.commsRepeaters
    var kiwixLibrary: [KiwixResource] = []

    private let storageKey = "griddown_app_data"
    private let versionKey = "griddown_data_version"
    private let currentDataVersion = 3

    init() {
        loadData()
    }

    private func loadData() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode(AppData.self, from: data) else { return }
        alertLevel = decoded.alertLevel
        groupName = decoded.groupName
        members = decoded.members
        supplies = decoded.supplies
        checklists = decoded.checklists.isEmpty ? MockData.checklists : decoded.checklists
        pois = decoded.pois.isEmpty ? MockData.allSeedPois : decoded.pois
        routes = decoded.routes.isEmpty ? MockData.defaultRoutes : decoded.routes
        commsChannels = decoded.commsChannels.isEmpty ? MockData.commsChannels : decoded.commsChannels
        commsRepeaters = decoded.commsRepeaters.isEmpty ? MockData.commsRepeaters : decoded.commsRepeaters
        kiwixLibrary = decoded.kiwixLibrary

        // Merge new seed POIs/routes into existing saved data on version bump
        let savedVersion = UserDefaults.standard.integer(forKey: versionKey)
        if savedVersion < currentDataVersion {
            let existingPoiIds = Set(pois.map { $0.id })
            let missingPois = MockData.allSeedPois.filter { !existingPoiIds.contains($0.id) }
            if !missingPois.isEmpty {
                pois.append(contentsOf: missingPois)
            }
            let existingRouteIds = Set(routes.map { $0.id })
            let missingRoutes = MockData.defaultRoutes.filter { !existingRouteIds.contains($0.id) }
            if !missingRoutes.isEmpty {
                routes.append(contentsOf: missingRoutes)
            }
            // v3: seed starter supplies for users who never added any
            if supplies.isEmpty {
                supplies = MockData.seedSupplies
            }
            UserDefaults.standard.set(currentDataVersion, forKey: versionKey)
            persist()
        }
    }

    private func persist() {
        let data = AppData(
            alertLevel: alertLevel, groupName: groupName, members: members,
            supplies: supplies, checklists: checklists, pois: pois, routes: routes,
            commsChannels: commsChannels, commsRepeaters: commsRepeaters,
            kiwixLibrary: kiwixLibrary
        )
        if let encoded = try? JSONEncoder().encode(data) {
            UserDefaults.standard.set(encoded, forKey: storageKey)
        }
    }

    var supplyStats: (total: Int, low: Int, categories: Int) {
        let total = supplies.count
        let low = supplies.filter { $0.quantity <= $0.minimumQuantity }.count
        let categories = Set(supplies.map { $0.category }).count
        return (total, low, categories)
    }

    func checklistStats(for id: String) -> (completed: Int, total: Int, percent: Int)? {
        guard let cl = checklists.first(where: { $0.id == id }) else { return nil }
        let total = cl.items.count
        let completed = cl.items.filter { $0.completed }.count
        let percent = total > 0 ? Int((Double(completed) / Double(total)) * 100) : 0
        return (completed, total, percent)
    }

    var overallChecklistStats: (completed: Int, total: Int, percent: Int) {
        let total = checklists.flatMap { $0.items }.count
        let completed = checklists.flatMap { $0.items }.filter { $0.completed }.count
        let percent = total > 0 ? Int((Double(completed) / Double(total)) * 100) : 0
        return (completed, total, percent)
    }

    // MARK: - Mutations

    func updateAlertLevel(_ level: AlertLevel) {
        alertLevel = level
        persist()
    }

    func addMember(_ member: GroupMember) { members.append(member); persist() }
    func updateMember(_ member: GroupMember) {
        if let idx = members.firstIndex(where: { $0.id == member.id }) { members[idx] = member; persist() }
    }
    func removeMember(_ id: String) { members.removeAll { $0.id == id }; persist() }

    func addSupply(_ item: SupplyItem) { supplies.append(item); persist() }
    func updateSupply(_ item: SupplyItem) {
        if let idx = supplies.firstIndex(where: { $0.id == item.id }) { supplies[idx] = item; persist() }
    }
    func removeSupply(_ id: String) { supplies.removeAll { $0.id == id }; persist() }

    func toggleChecklistItem(checklistId: String, itemId: String) {
        guard let clIdx = checklists.firstIndex(where: { $0.id == checklistId }) else { return }
        if let itemIdx = checklists[clIdx].items.firstIndex(where: { $0.id == itemId }) {
            checklists[clIdx].items[itemIdx].completed.toggle()
            checklists[clIdx].lastUpdated = ISO8601DateFormatter().string(from: Date())
            persist()
        }
    }

    func addPoi(_ poi: POI) { pois.append(poi); persist() }
    func updatePoi(_ poi: POI) {
        if let idx = pois.firstIndex(where: { $0.id == poi.id }) { pois[idx] = poi; persist() }
    }
    func removePoi(_ id: String) { pois.removeAll { $0.id == id }; persist() }

    func addRoute(_ route: Route) { routes.append(route); persist() }
    func updateRoute(_ route: Route) {
        if let idx = routes.firstIndex(where: { $0.id == route.id }) { routes[idx] = route; persist() }
    }
    func removeRoute(_ id: String) { routes.removeAll { $0.id == id }; persist() }

    func addCommsChannel(_ channel: CommsChannel) { commsChannels.append(channel); persist() }
    func updateCommsChannel(_ channel: CommsChannel) {
        if let idx = commsChannels.firstIndex(where: { $0.id == channel.id }) { commsChannels[idx] = channel; persist() }
    }
    func removeCommsChannel(_ id: String) { commsChannels.removeAll { $0.id == id }; persist() }

    func addCommsRepeater(_ repeater: CommsRepeater) { commsRepeaters.append(repeater); persist() }
    func updateCommsRepeater(_ repeater: CommsRepeater) {
        if let idx = commsRepeaters.firstIndex(where: { $0.id == repeater.id }) { commsRepeaters[idx] = repeater; persist() }
    }
    func removeCommsRepeater(_ id: String) { commsRepeaters.removeAll { $0.id == id }; persist() }

    func saveKiwixResource(_ resource: KiwixResource) {
        guard !kiwixLibrary.contains(where: { $0.id == resource.id }) else { return }
        var saved = resource
        saved.status = .saved
        saved.savedAt = ISO8601DateFormatter().string(from: Date())
        kiwixLibrary.append(saved)
        persist()
    }
    func removeKiwixResource(_ id: String) { kiwixLibrary.removeAll { $0.id == id }; persist() }

    // MARK: - Ops Backup

    static let opsBackupFormat = "griddown-ops-backup"
    static let opsBackupVersion = 1

    var opsCountsSummary: String {
        "\(members.count) members · \(supplies.count) supplies · \(pois.count) POIs · \(routes.count) routes · \(commsChannels.count) channels · \(commsRepeaters.count) repeaters"
    }

    /// Serializes the entire ops kit as a pretty-printed JSON string.
    func exportOpsBackup() -> String? {
        let file = OpsBackupExportFile(
            format: Self.opsBackupFormat,
            version: Self.opsBackupVersion,
            exportedAt: ISO8601DateFormatter().string(from: Date()),
            data: AppData(
                alertLevel: alertLevel, groupName: groupName, members: members,
                supplies: supplies, checklists: checklists, pois: pois, routes: routes,
                commsChannels: commsChannels, commsRepeaters: commsRepeaters,
                kiwixLibrary: kiwixLibrary
            )
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let encoded = try? encoder.encode(file) else { return nil }
        return String(data: encoded, encoding: .utf8)
    }

    /// Returns a human-readable counts summary if the string parses as a valid backup.
    func opsBackupSummary(_ raw: String) -> String? {
        guard let payload = parseOpsBackup(raw) else { return nil }
        let m = payload.members?.count ?? 0
        let s = payload.supplies?.count ?? 0
        let p = payload.pois?.count ?? 0
        let r = payload.routes?.count ?? 0
        let c = payload.commsChannels?.count ?? 0
        let rp = payload.commsRepeaters?.count ?? 0
        return "\(m) members · \(s) supplies · \(p) POIs · \(r) routes · \(c) channels · \(rp) repeaters"
    }

    /// Replaces all app data with the parsed backup. Returns false if invalid.
    func importOpsBackup(_ raw: String) -> Bool {
        guard let payload = parseOpsBackup(raw) else { return false }
        alertLevel = payload.alertLevel ?? .green
        let trimmedName = payload.groupName?.trimmingCharacters(in: .whitespaces) ?? ""
        groupName = trimmedName.isEmpty ? "My Group" : trimmedName
        members = payload.members ?? []
        supplies = payload.supplies ?? []
        checklists = payload.checklists ?? []
        pois = payload.pois ?? []
        routes = payload.routes ?? []
        commsChannels = payload.commsChannels ?? []
        commsRepeaters = payload.commsRepeaters ?? []
        kiwixLibrary = payload.kiwixLibrary ?? []
        persist()
        return true
    }

    /// Accepts either a wrapped ops-backup file or raw app data JSON.
    private func parseOpsBackup(_ raw: String) -> OpsBackupData? {
        guard let jsonData = raw.data(using: .utf8) else { return nil }
        let decoder = JSONDecoder()
        if let wrapped = try? decoder.decode(OpsBackupWrapper.self, from: jsonData),
           wrapped.format == Self.opsBackupFormat,
           let inner = wrapped.data {
            return inner
        }
        if let direct = try? decoder.decode(OpsBackupData.self, from: jsonData), direct.hasContent {
            return direct
        }
        return nil
    }
}
