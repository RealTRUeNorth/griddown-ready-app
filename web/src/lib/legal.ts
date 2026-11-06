/**
 * Legal & compliance disclosures and Help/FAQ content, shared by the
 * Legal and Help screens. Mirrors the copy in the iOS app.
 */

export interface LegalSection {
  title: string;
  body: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export const legalSections: LegalSection[] = [
  {
    title: 'EMERGENCY NOTICE',
    body: 'GRIDDOWN is a preparedness planner, not an emergency service. It does not contact responders, dispatch help, or monitor anyone\'s safety. In a real emergency, call 911 (US) or your local emergency number immediately.',
  },
  {
    title: 'MEDICAL DISCLAIMER',
    body: 'Guides and checklists in this app summarize widely published public guidance for general education only. They are not medical advice, diagnosis, or treatment, and using the app does not create any professional relationship. Always defer to trained medical professionals and follow current instructions from qualified authorities such as the American Red Cross, American Heart Association, WHO, and CDC.',
  },
  {
    title: 'NOT AN OFFICIAL SOURCE',
    body: 'GRIDDOWN is an independent app. It is not affiliated with, endorsed by, or connected to FEMA, Ready.gov, the American Red Cross, the American Heart Association, the World Health Organization, the CDC, ARRL, or any government agency. Source names are referenced for attribution only. Consult official channels for authoritative guidance.',
  },
  {
    title: 'PRIVACY & DATA',
    body: 'All of your data — members, supplies, checklists, POIs, routes, comms plans, and downloads — is stored locally on this device. The app has no accounts, no analytics, no advertising, and no tracking. Location is used only to show local weather forecasts and to generate nearby rally points, routes, and map content, and never leaves your device. Notifications are scheduled locally. Ops backups are exported only when you explicitly share them.',
  },
  {
    title: 'THIRD-PARTY DATA & CREDITS',
    body: 'Weather forecasts are provided by Open-Meteo (open-meteo.com, CC BY 4.0). Map tiles are © OpenStreetMap contributors (ODbL). Offline reading resources are provided in the Kiwix/ZIM format by their respective publishers; each resource remains under its own license and terms.',
  },
  {
    title: 'COPYRIGHT',
    body: '© 2026 GRIDDOWN. All rights reserved. The GRIDDOWN name, design, and original content are protected by copyright. Third-party data and trademarks referenced in the app remain the property of their respective owners.',
  },
];

export const faqEntries: FaqEntry[] = [
  {
    question: 'What is GRIDDOWN?',
    answer:
      'An offline tactical preparedness planner for a family or small group: a roster with check-ins, supply inventory with expiry alerts, offline field guides, a map with rally points and routes, and a comms plan. Everything lives on your device.',
  },
  {
    question: 'Does it work without internet?',
    answer:
      'Yes — guides, checklists, supplies, the comms plan, the barometer, and downloaded map packs all work fully offline. Weather forecasts need a connection the first time and are then cached for offline use.',
  },
  {
    question: 'How do check-ins work?',
    answer:
      'Set the expected interval in Settings. Members who haven\'t checked in within that window show as overdue on the Status screen. With Reminders on, a repeating local notification nudges you.',
  },
  {
    question: 'How do supply expiry alerts work?',
    answer:
      'Add an expiration date to any supply. When Reminders are on, you get a local notification 30 days before it expires, and expired or low items are flagged in the list.',
  },
  {
    question: 'How do offline map packs work?',
    answer:
      'On the Map tab, position the view over your area and prepare a pack. It downloads map tiles for that region so the map still renders with no connectivity.',
  },
  {
    question: 'How do I text my group?',
    answer:
      'Comms tab → SMS GROUP opens your Messages app with every member\'s phone number and a status snapshot. On a member\'s profile, Send Text messages that person. Standard carrier rates apply.',
  },
  {
    question: 'What does Shake for SOS do?',
    answer:
      'A firm shake opens a confirmation to set the group alert level to RED. Turn it on or off in Settings → Sensors.',
  },
  {
    question: 'The barometer reading differs from the forecast — why?',
    answer:
      'The Device Barometer card uses your phone\'s live pressure sensor (station pressure). Forecast pressure is adjusted to sea level, so the numbers won\'t match exactly — the trend is what matters.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'Only on this device. Use the ops backup on the Intel tab to export everything as a file you can share or import on another device.',
  },
  {
    question: 'Why is some of my data marked SAMPLE?',
    answer:
      'The app ships with sample members, supplies, POIs, and routes so you can explore before entering real data. Sample supplies include intentionally expired items that demonstrate the expiry alert system. Edit or delete them and add your own.',
  },
  {
    question: 'Why does the app ask for my location?',
    answer:
      'To show local weather forecasts and to generate nearby rally points, routes, and map content the first time you open the map. Location never leaves your device.',
  },
  {
    question: 'Is this a replacement for emergency services?',
    answer:
      'No. GRIDDOWN helps you plan and coordinate, but it cannot call for help or guarantee anyone\'s safety. Always call 911 (US) or your local emergency number in a real emergency.',
  },
];
