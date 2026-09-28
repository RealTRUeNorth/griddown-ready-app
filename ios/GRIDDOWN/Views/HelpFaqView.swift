import SwiftUI

struct FaqEntry: Identifiable {
    let id: String
    let question: String
    let answer: String

    static let entries: [FaqEntry] = [
        FaqEntry(
            id: "what",
            question: "What is GRIDDOWN?",
            answer: "An offline tactical preparedness planner for a family or small group: a roster with check-ins, supply inventory with expiry alerts, offline field guides, a map with rally points and routes, and a comms plan. Everything lives on your device."
        ),
        FaqEntry(
            id: "offline",
            question: "Does it work without internet?",
            answer: "Yes — guides, checklists, supplies, the comms plan, the barometer, and downloaded map packs all work fully offline. Weather forecasts need a connection the first time and are then cached for offline use."
        ),
        FaqEntry(
            id: "checkins",
            question: "How do check-ins work?",
            answer: "Set the expected interval in Settings. Members who haven't checked in within that window show as overdue on the Status screen. With Reminders on, a repeating local notification nudges you."
        ),
        FaqEntry(
            id: "expiry",
            question: "How do supply expiry alerts work?",
            answer: "Add an expiration date to any supply. When Reminders are on, you get a local notification 30 days before it expires, and expired or low items are flagged in the list."
        ),
        FaqEntry(
            id: "mappacks",
            question: "How do offline map packs work?",
            answer: "On the Map tab, position the view over your area and prepare a pack. It downloads map tiles for that region so the map still renders with no connectivity."
        ),
        FaqEntry(
            id: "sms",
            question: "How do I text my group?",
            answer: "Comms tab → SMS GROUP opens your Messages app with every member's phone number and a status snapshot. On a member's profile, Send Text messages that person. Standard carrier rates apply."
        ),
        FaqEntry(
            id: "shake",
            question: "What does Shake for SOS do?",
            answer: "A firm shake opens a confirmation to set the group alert level to RED. Turn it on or off in Settings → Sensors."
        ),
        FaqEntry(
            id: "barometer",
            question: "The barometer reading differs from the forecast — why?",
            answer: "The Device Barometer card uses your phone's live pressure sensor (station pressure). Forecast pressure is adjusted to sea level, so the numbers won't match exactly — the trend is what matters."
        ),
        FaqEntry(
            id: "storage",
            question: "Where is my data stored?",
            answer: "Only on this device. Use the ops backup on the Intel tab to export everything as a file you can share or import on another device."
        ),
        FaqEntry(
            id: "sample",
            question: "Why is some of my data marked SAMPLE?",
            answer: "The app ships with sample members, supplies, POIs, and routes so you can explore before entering real data. Sample supplies include intentionally expired items that demonstrate the expiry alert system. Edit or delete them and add your own."
        ),
        FaqEntry(
            id: "location",
            question: "Why does the app ask for my location?",
            answer: "To show local weather forecasts and to generate nearby rally points, routes, and map content the first time you open the map. Location never leaves your device."
        ),
        FaqEntry(
            id: "911",
            question: "Is this a replacement for emergency services?",
            answer: "No. GRIDDOWN helps you plan and coordinate, but it cannot call for help or guarantee anyone's safety. Always call 911 (US) or your local emergency number in a real emergency."
        ),
    ]
}

/// Help & FAQ: quick answers about core features, data storage, and limits.
struct HelpFaqView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(FaqEntry.entries) { entry in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(entry.question)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                        Text(entry.answer)
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Theme.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                    .clipShape(.rect(cornerRadius: 12))
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Help & FAQ")
        .navigationBarTitleDisplayMode(.inline)
    }
}
