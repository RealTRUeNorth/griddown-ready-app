import Foundation
import SwiftUI

enum AlertLevel: String, Codable, CaseIterable {
    case green, amber, red

    var label: String {
        switch self {
        case .green: "ALL CLEAR"
        case .amber: "ELEVATED"
        case .red: "RED ALERT"
        }
    }

    var description: String {
        switch self {
        case .green: "Normal operations. Continue monitoring."
        case .amber: "Heightened awareness. Review checklists."
        case .red: "Execute emergency protocols now."
        }
    }

    var color: Color {
        switch self {
        case .green: Theme.statusGreen
        case .amber: Theme.statusAmber
        case .red: Theme.statusRed
        }
    }

    var bgColor: Color {
        switch self {
        case .green: Theme.statusGreen.opacity(0.15)
        case .amber: Theme.statusAmber.opacity(0.15)
        case .red: Theme.statusRed.opacity(0.15)
        }
    }
}

struct Coordinates: Codable, Hashable, Sendable {
    var latitude: Double
    var longitude: Double
}

enum MemberStatus: String, Codable, CaseIterable {
    case ready, unavailable, unknown

    var color: Color {
        switch self {
        case .ready: Theme.statusGreen
        case .unavailable: Theme.statusRed
        case .unknown: Theme.statusAmber
        }
    }

    var label: String {
        switch self {
        case .ready: "Ready"
        case .unavailable: "Unavailable"
        case .unknown: "Unknown"
        }
    }
}

struct GroupMember: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var role: String
    var skills: [String]
    var status: MemberStatus
    var phone: String?
    var notes: String?
    var location: Coordinates?
    var locationUpdatedAt: String?
}

enum SupplyCategory: String, Codable, CaseIterable {
    case water, food, medical, tools, comms, shelter, clothing, documents, other

    var label: String {
        switch self {
        case .water: "Water"
        case .food: "Food"
        case .medical: "Medical"
        case .tools: "Tools"
        case .comms: "Comms"
        case .shelter: "Shelter"
        case .clothing: "Clothing"
        case .documents: "Documents"
        case .other: "Other"
        }
    }

    var iconName: String {
        switch self {
        case .water: "drop.fill"
        case .food: "fork.knife"
        case .medical: "heart.text.square.fill"
        case .tools: "wrench.adjustable.fill"
        case .comms: "antenna.radiowaves.left.and.right"
        case .shelter: "house.fill"
        case .clothing: "tshirt.fill"
        case .documents: "doc.text.fill"
        case .other: "shippingbox.fill"
        }
    }

    var color: Color {
        switch self {
        case .water: Theme.oliveLight
        case .food: Theme.oliveLight
        case .medical: Theme.redLight
        case .tools: Theme.orangeLight
        case .comms: Theme.amberLight
        case .shelter: Theme.oliveLight
        case .clothing: Theme.oliveLight
        case .documents: Theme.oliveLight
        case .other: Theme.textSecondary
        }
    }
}

struct SupplyItem: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var category: SupplyCategory
    var quantity: Int
    var unit: String
    var minimumQuantity: Int
    var expirationDate: String?
    var notes: String?
}

struct ChecklistItem: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var text: String
    var completed: Bool
}

struct Checklist: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var title: String
    var description: String
    var icon: String
    var items: [ChecklistItem]
    var lastUpdated: String
}

struct GuideSection: Codable, Hashable, Sendable {
    var title: String
    var content: String
}

struct Guide: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var title: String
    var category: String
    var icon: String
    var summary: String
    var sections: [GuideSection]
}

enum POICategory: String, Codable, CaseIterable {
    case water, shelter, medical, supplyCache, rallyPoint, hazard, comms, gasStation, hospital, pharmacy, police, fireStation, other

    var label: String {
        switch self {
        case .water: "Water Source"
        case .shelter: "Shelter"
        case .medical: "Medical"
        case .supplyCache: "Supply Cache"
        case .rallyPoint: "Rally Point"
        case .hazard: "Hazard"
        case .comms: "Comms Point"
        case .gasStation: "Gas Station"
        case .hospital: "Hospital"
        case .pharmacy: "Pharmacy"
        case .police: "Police Station"
        case .fireStation: "Fire Station"
        case .other: "Other"
        }
    }

    var color: Color {
        switch self {
        case .water: Color(hex: 0x4A90D9)
        case .shelter: Color(hex: 0x8B6914)
        case .medical: Theme.red
        case .supplyCache: Theme.orange
        case .rallyPoint: Theme.statusGreen
        case .hazard: Theme.statusRed
        case .comms: Color(hex: 0x9B59B6)
        case .gasStation: Color(hex: 0xE88A3A)
        case .hospital: Color(hex: 0xE53935)
        case .pharmacy: Color(hex: 0x43A047)
        case .police: Color(hex: 0x1E88E5)
        case .fireStation: Color(hex: 0xD32F2F)
        case .other: Theme.textSecondary
        }
    }

    var iconName: String {
        switch self {
        case .water: "drop.fill"
        case .shelter: "house.fill"
        case .medical: "cross.case.fill"
        case .supplyCache: "shippingbox.fill"
        case .rallyPoint: "flag.fill"
        case .hazard: "exclamationmark.triangle.fill"
        case .comms: "antenna.radiowaves.left.and.right"
        case .gasStation: "fuel.fill"
        case .hospital: "building.2.fill"
        case .pharmacy: "pill.fill"
        case .police: "shield.lefthalf.filled"
        case .fireStation: "flame.fill"
        case .other: "mappin"
        }
    }

    var isInfrastructure: Bool {
        switch self {
        case .gasStation, .hospital, .pharmacy, .police, .fireStation: true
        default: false
        }
    }
}

struct POI: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var category: POICategory
    var coordinates: Coordinates
    var notes: String?
    var createdAt: String
}

struct Route: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var color: String
    var waypoints: [Coordinates]
    var notes: String?
    var createdAt: String
}

enum CommsBand: String, Codable, CaseIterable {
    case FRS, GMRS, MURS, CB, VHFMarine = "VHF_Marine", HAMVHF = "HAM_VHF", HAMUHF = "HAM_UHF", HF, Custom

    var label: String {
        switch self {
        case .FRS: "Family Radio Service"
        case .GMRS: "General Mobile Radio"
        case .MURS: "Multi-Use Radio"
        case .CB: "Citizens Band"
        case .VHFMarine: "VHF Marine"
        case .HAMVHF: "Amateur VHF"
        case .HAMUHF: "Amateur UHF"
        case .HF: "High Frequency"
        case .Custom: "Custom"
        }
    }

    var range: String {
        switch self {
        case .FRS: "0.5-2 mi"
        case .GMRS: "2-25 mi"
        case .MURS: "1-5 mi"
        case .CB: "3-20 mi"
        case .VHFMarine: "5-60 mi"
        case .HAMVHF: "5-50+ mi"
        case .HAMUHF: "5-30+ mi"
        case .HF: "100+ mi"
        case .Custom: "Varies"
        }
    }

    var license: String {
        switch self {
        case .FRS, .MURS, .CB: "No license"
        case .GMRS: "FCC license required"
        case .VHFMarine: "MMSI registration"
        case .HAMVHF, .HAMUHF: "HAM Technician+"
        case .HF: "HAM General+"
        case .Custom: "Varies"
        }
    }

    var color: Color {
        switch self {
        case .FRS: Theme.statusGreen
        case .GMRS: Color(hex: 0x2196F3)
        case .MURS: Color(hex: 0x9C27B0)
        case .CB: Color(hex: 0xFF9800)
        case .VHFMarine: Color(hex: 0x00BCD4)
        case .HAMVHF: Theme.statusRed
        case .HAMUHF: Color(hex: 0xE91E63)
        case .HF: Color(hex: 0x673AB7)
        case .Custom: Color(hex: 0x607D8B)
        }
    }
}

enum CommsMode: String, Codable, CaseIterable {
    case simplex, duplex, mesh, repeater

    var label: String {
        rawValue.capitalized
    }
}

struct CommsChannel: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var band: CommsBand
    var frequency: String
    var mode: CommsMode
    var purpose: String
    var ctcssTone: String?
    var power: String?
    var notes: String?
    var isPrimary: Bool?
}

struct CommsRepeater: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var name: String
    var inputFreq: String
    var outputFreq: String
    var offset: String
    var ctcssTone: String
    var location: String?
    var coordinates: Coordinates?
    var range: String?
    var notes: String?
}

struct CommsProtocol: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var title: String
    var description: String
    var steps: [String]
}

enum KiwixCategory: String, Codable, CaseIterable {
    case medical, survival, homesteading, comms, engineering, reference, agriculture, security, other

    var label: String {
        switch self {
        case .medical: "Medical"
        case .survival: "Survival"
        case .homesteading: "Homestead"
        case .comms: "Comms"
        case .engineering: "Engineering"
        case .reference: "Reference"
        case .agriculture: "Agriculture"
        case .security: "Security"
        case .other: "Other"
        }
    }

    var iconName: String {
        switch self {
        case .medical: "stethoscope"
        case .survival: "safari"
        case .homesteading: "house"
        case .comms: "antenna.radiowaves.left.and.right"
        case .engineering: "wrench.adjustable"
        case .agriculture: "leaf"
        case .security: "shield"
        case .reference: "books.vertical"
        case .other: "bookmark"
        }
    }

    var color: Color {
        switch self {
        case .medical: Color(hex: 0xCC3333)
        case .survival: Theme.green
        case .homesteading: Theme.orange
        case .comms: Color(hex: 0x5588CC)
        case .engineering: Color(hex: 0x9A7B4A)
        case .agriculture: Color(hex: 0x6B8B4A)
        case .security: Color(hex: 0x8B4A6B)
        case .reference: Color(hex: 0x6A6AAB)
        case .other: Theme.textMuted
        }
    }
}

enum KiwixStatus: String, Codable {
    case available, saved, downloaded
}

struct KiwixResource: Identifiable, Codable, Hashable, Sendable {
    var id: String
    var title: String
    var category: KiwixCategory
    var description: String
    var sizeLabel: String
    var downloadUrl: String
    var language: String
    var lastUpdated: String
    var tags: [String]
    var status: KiwixStatus
    var savedAt: String?
}

struct WeatherData: Codable, Sendable {
    var temperature: Double
    var feelsLike: Double
    var humidity: Double
    var windSpeed: Double
    var windDirection: Double
    var weatherCode: Int
    var precipitation: Double
    var pressure: Double
    var isDay: Bool
    var updatedAt: String
}

struct WeatherForecastHour: Identifiable, Codable, Sendable {
    var id: String { time }
    var time: String
    var temperature: Double
    var weatherCode: Int
    var precipitation: Double
    var windSpeed: Double
}

struct WeatherForecastDay: Identifiable, Codable, Sendable {
    var id: String { date }
    var date: String
    var tempMax: Double
    var tempMin: Double
    var weatherCode: Int
    var precipSum: Double
    var windMax: Double
    var sunrise: String
    var sunset: String
}

struct AppData: Codable, Sendable {
    var alertLevel: AlertLevel = .green
    var groupName: String = "My Group"
    var members: [GroupMember] = []
    var supplies: [SupplyItem] = []
    var checklists: [Checklist] = []
    var pois: [POI] = []
    var routes: [Route] = []
    var commsChannels: [CommsChannel] = []
    var commsRepeaters: [CommsRepeater] = []
    var kiwixLibrary: [KiwixResource] = []
}
