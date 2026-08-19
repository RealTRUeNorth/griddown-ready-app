import SwiftUI

enum Theme {
    static let bg = Color(hex: 0x1A1D1A)
    static let bgCard = Color(hex: 0x242824)
    static let bgCardLight = Color(hex: 0x2E332E)
    static let bgElevated = Color(hex: 0x333833)
    static let border = Color(hex: 0x3A3F3A)
    static let borderLight = Color(hex: 0x4A504A)
    static let olive = Color(hex: 0x6B7A4A)
    static let oliveLight = Color(hex: 0x8B9A6A)
    static let oliveMuted = Color(hex: 0x4A5A3A)
    static let orange = Color(hex: 0xD4822A)
    static let orangeLight = Color(hex: 0xE8A04A)
    static let orangeMuted = Color(hex: 0x8B5A1A)
    static let red = Color(hex: 0xCC3333)
    static let redLight = Color(hex: 0xE85555)
    static let redMuted = Color(hex: 0x662222)
    static let amber = Color(hex: 0xD4A22A)
    static let amberLight = Color(hex: 0xE8C04A)
    static let green = Color(hex: 0x4A8B4A)
    static let greenLight = Color(hex: 0x6AAB6A)
    static let textPrimary = Color(hex: 0xE8E4DC)
    static let textSecondary = Color(hex: 0x9A9890)
    static let textMuted = Color(hex: 0x6A6860)
    static let statusGreen = Color(hex: 0x4CAF50)
    static let statusAmber = Color(hex: 0xFFC107)
    static let statusRed = Color(hex: 0xF44336)
}

extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: alpha
        )
    }
}
