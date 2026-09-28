import SwiftUI

/// Legal & compliance disclosures: emergency scope, medical disclaimer,
/// source affiliations, privacy posture, third-party data credits, copyright.
struct LegalView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ForEach(LegalSection.entries) { section in
                    sectionCard(section)
                }
                Text("Last updated: September 2026")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.textMuted)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Legal & Compliance")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sectionCard(_ section: LegalSection) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(section.title)
                .font(.system(size: 10, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.oliveLight)
            Text(section.body)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }
}

struct LegalSection: Identifiable {
    let id: String
    let title: String
    let body: String

    static let entries: [LegalSection] = [
        LegalSection(
            id: "emergency",
            title: "EMERGENCY NOTICE",
            body: "GRIDDOWN is a preparedness planner, not an emergency service. It does not contact responders, dispatch help, or monitor anyone's safety. In a real emergency, call 911 (US) or your local emergency number immediately."
        ),
        LegalSection(
            id: "medical",
            title: "MEDICAL DISCLAIMER",
            body: "Guides and checklists in this app summarize widely published public guidance for general education only. They are not medical advice, diagnosis, or treatment, and using the app does not create any professional relationship. Always defer to trained medical professionals and follow current instructions from qualified authorities such as the American Red Cross, American Heart Association, WHO, and CDC."
        ),
        LegalSection(
            id: "sources",
            title: "NOT AN OFFICIAL SOURCE",
            body: "GRIDDOWN is an independent app. It is not affiliated with, endorsed by, or connected to FEMA, Ready.gov, the American Red Cross, the American Heart Association, the World Health Organization, the CDC, ARRL, or any government agency. Source names are referenced for attribution only. Consult official channels for authoritative guidance."
        ),
        LegalSection(
            id: "privacy",
            title: "PRIVACY & DATA",
            body: "All of your data — members, supplies, checklists, POIs, routes, comms plans, and downloads — is stored locally on this device. The app has no accounts, no analytics, no advertising, and no tracking. Location is used only to show local weather forecasts and to generate nearby rally points, routes, and map content, and never leaves your device. Notifications are scheduled locally. Ops backups are exported only when you explicitly share them."
        ),
        LegalSection(
            id: "third-party",
            title: "THIRD-PARTY DATA & CREDITS",
            body: "Weather forecasts are provided by Open-Meteo (open-meteo.com, CC BY 4.0). Map tiles are © OpenStreetMap contributors (ODbL). Offline reading resources are provided in the Kiwix/ZIM format by their respective publishers; each resource remains under its own license and terms."
        ),
        LegalSection(
            id: "copyright",
            title: "COPYRIGHT",
            body: "© 2026 GRIDDOWN. All rights reserved. The GRIDDOWN name, design, and original content are protected by copyright. Third-party data and trademarks referenced in the app remain the property of their respective owners."
        ),
    ]
}
