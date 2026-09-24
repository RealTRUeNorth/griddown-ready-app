<div align="center">

# GRIDDOWN

### Offline-first preparedness & grid-down operations app

**Tactical map · Weather · Comms · Supplies · Checklists · Group roster · Offline library · Field guides**

Built with React Native (Expo) and SwiftUI — two platforms, one mission.

</div>

---

## Overview

GRIDDOWN is a mobile preparedness app designed for scenarios where infrastructure is degraded or completely unavailable — power outages, natural disasters, off-grid operations, and emergency response. Every core feature works **offline** with no external API keys required.

The app provides a unified tactical interface for managing your group's readiness: personnel tracking, supply inventories, communication plans, tactical mapping, weather monitoring, operational checklists, and an offline reference library.

> **Design philosophy:** Dark tactical theme optimized for low-light and night operations. Olive and orange accents on a deep charcoal canvas. Apple-level polish on both platforms.

## Features

### Status Dashboard
- Real-time alert level indicator (Green / Amber / Red) with one-tap switching
- Aggregate readiness stats — members ready, supplies tracked, low-stock alerts, checklist completion
- Per-member check-in clock with a configurable cadence (2–24h): due-soon at 75% of the interval, overdue at 100%
- Inventory alert feed (expired / expiring soon / low stock) that jumps straight into the item
- Quick-access grid resolved dynamically to the right checklists and guides

### Prep Hub
- **Weather** — Live conditions via Open-Meteo API (no API key needed): temperature, feels-like, humidity, wind, pressure, UV index, visibility, precipitation. Hourly + 7-day forecasts. Operational impact assessment. The last successful fetch is cached locally and shown with an OFFLINE chip when the network is gone. Weather-triggered resource suggestions (rain → water collection, storms → shelter) can be added as POIs in one tap.
- **Supplies** — Full inventory management with 9 categories (water, food, medical, tools, comms, shelter, clothing, documents, other). Quantity tracking with minimum-stock thresholds and low-stock warnings. Expiration date tracking with 30-day expiry alerts. Real-time search filtering. Category filter chips. Ships with a 14-item starter inventory (including one expired and one expiring-soon item so the alert system demos itself).
- **Checklists** — 8 pre-loaded operational checklists with progress bars: Bug-Out Bag, Shelter-In-Place, Comms Plan, Vehicle Readiness, First Aid Kit, Water Storage, Sanitation Kit, Generator & Power.

### Tactical Map
- Interactive map with custom POI annotations (14 categories: water, shelter, medical, supply cache, rally point, hazard, comms, gas station, hospital, pharmacy, police, fire station, weather resource, other)
- Custom route plotting with colored polylines and waypoints
- Layer toggles for POIs, routes, and member locations; search filters map markers too
- **Offline map packs** — download the current view as an OpenStreetMap tile pack (zooms 12–15, ≤6,000 tiles, size estimated before you confirm). When "Use Offline Tiles" is on, the map renders 100% from local storage with zero network: pan/zoom, POI markers with category colors, and your location dot all work with no signal. Live download progress, cancel, delete, and automatic pruning of broken packs.
- Location-aware first launch: tactical POIs and routes are seeded around your actual location (rally points, water source, cache, comms point, hazard) instead of the bundled St. Louis demo data.

### Comms
- **Channels** — Manage comms channels across 9 bands (FRS, GMRS, MURS, CB, VHF Marine, HAM VHF, HAM UHF, HF, Custom). Track frequency, mode (simplex/duplex/mesh/repeater), CTCSS tones, power, purpose. Primary channel designation.
- **Repeaters** — Repeater station registry with input/output frequencies, offset, CTCSS, location, and range.
- **Protocols** — 6 expandable operational protocol cards with step-by-step procedures, including a brevity codes & prowords reference card (phonetic alphabet, OVER/OUT, SAY AGAIN, readability scale).
- **Reference** — Quick-reference band chart with frequency ranges, power limits, and use cases.

### Intel
- **Group Roster** — Member management with roles, skills, status tracking (ready / unavailable / unknown), phone numbers, notes, and per-member check-in history.
- **Kiwix Offline Library** — 15 real ZIM resources with genuine full-file downloads, progress tracking, and cancel (WikiMed medical encyclopedias, Outdoors & HAM & Information-Security Stack Exchanges, Appropedia, iFixit, Wikipedia topic packs, Wikibooks, Wikispecies, TED, Wikivoyage, Wiktionary). All URLs and sizes verified against download.kiwix.org. Search and category filtering.
- **Field Guides** — 8 pre-loaded multi-section guides: Water Purification, First Aid Essentials, Emergency Communications, Shelter & Warmth, Food Preservation, Sanitation & Hygiene, Backup Power, Security & Watch Protocols.
- **Ops Backup** — export the entire ops kit (members, supplies, checklists, POIs, routes, comms, library) through the system share sheet — Files, Messages, AirDrop, mail — with a clipboard fallback, and import it back with a confirmation dialog. Same JSON format on both platforms.

### Reminders (optional)
- Local notifications only — nothing leaves the device and there is no push server
- A repeating check-in reminder follows the group cadence setting
- Supply expiry alerts fire 30 days before each expiration date
- Enable in Settings → Reminders; changing the cadence or editing supplies reschedules automatically

## Screenshots

> Add screenshots to a `/docs/screenshots/` directory and reference them here.

## Tech Stack

### Expo / React Native App (`expo/`)

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Language | TypeScript 5.9 |
| State | React Query + Context (via `@nkzw/create-context-hook`) |
| Persistence | AsyncStorage (local, offline-first) |
| Maps | `react-native-maps` (lazy-loaded on native) + custom offline tile renderer |
| Location | `expo-location` (lazy-loaded on native) |
| Offline content | Kiwix ZIM downloads + OSM tile packs |
| Notifications | `expo-notifications` (local scheduling) |
| Icons | `lucide-react-native` |
| Haptics | `expo-haptics` |
| Package Manager | Bun |

### iOS / SwiftUI App (`ios/`)

| Category | Technology |
|----------|-----------|
| Framework | SwiftUI (iOS 18+) |
| Language | Swift 6 (Approachable Concurrency) |
| State | `@Observable` macro (Swift Observation) |
| Persistence | `UserDefaults` |
| Maps | MapKit (native `Map` API) + `MKTileOverlay` offline tile renderer |
| Location | CoreLocation |
| Offline content | Kiwix ZIM downloads (`URLSession`) + OSM tile packs |
| Notifications | `UserNotifications` (local scheduling) |
| Icons | SF Symbols |
| Haptics | `UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator` |
| Navigation | `NavigationStack` + type-safe `NavRoute` enum |

### Shared
- **Weather API:** [Open-Meteo](https://open-meteo.com/) — free, no API key, no auth
- **Design theme:** Dark tactical (`#1A1D1A` canvas, olive `#6B7A4A`, orange `#D4822A` accents)
- **Offline-first:** All data persists locally — no backend required for core functionality

## Project Structure

```
GRIDDOWN/
├── expo/                          # React Native / Expo app
│   ├── app/                       # Expo Router screens
│   │   ├── (tabs)/                # 5-tab navigation
│   │   │   ├── (home)/            # Status dashboard
│   │   │   ├── prep/              # Prep hub → weather, supplies, checklists
│   │   │   ├── map/               # Tactical map + offline tile packs
│   │   │   ├── comms/             # Comms (channels, repeaters, protocols, reference)
│   │   │   ├── intel/             # Intel hub → group, library, guides, backup
│   │   │   └── _layout.tsx        # Tab bar configuration
│   │   ├── add-member.tsx         # Modal: add group member
│   │   ├── add-supply.tsx         # Modal: add supply item
│   │   ├── add-poi.tsx            # Modal: add map POI
│   │   ├── add-route.tsx          # Modal: add map route
│   │   ├── add-channel.tsx        # Modal: add comms channel
│   │   ├── add-repeater.tsx       # Modal: add repeater
│   │   ├── member-detail.tsx      # Member detail + check-in clock
│   │   ├── resource-detail.tsx    # Kiwix resource detail + download
│   │   ├── checklist-detail.tsx   # Checklist detail
│   │   ├── guide-detail.tsx       # Field guide detail
│   │   ├── settings.tsx           # Group name, cadence, reminders
│   │   └── +not-found.tsx         # 404 fallback
│   ├── assets/                    # App icons, splash, images
│   ├── components/                # OfflineTileMap, KiwixDownloadControl, SwipeableRow, WeatherSuggestionsBanner
│   ├── constants/                 # Theme colors, map helpers
│   ├── mocks/                     # Seed data (members, checklists, comms, POIs, guides, supplies, Kiwix)
│   ├── providers/                 # AppProvider, DownloadProvider, MapPacksProvider
│   ├── services/                  # Weather suggestions engine + cache
│   ├── utils/                     # Check-in math, supply alerts, tile math, ops backup, notifications
│   ├── types/                     # TypeScript type definitions
│   ├── app.json                   # Expo configuration
│   └── package.json               # Dependencies & scripts
│
├── ios/                           # Native SwiftUI app
│   └── GRIDDOWN/
│       ├── GRIDDOWNApp.swift      # @main entry point
│       ├── ContentView.swift      # TabView + NavigationStack routing
│       ├── Theme.swift            # Color palette (Color(hex:) extension)
│       ├── Models/                # AppModels.swift + MapPack.swift + MockData.swift
│       ├── Services/              # AppStore, TileDownloadManager, KiwixDownloadManager,
│       │                          # NotificationsService, WeatherCache, SupplyAlerts, CheckIn…
│       ├── Views/                 # All SwiftUI views
│       │   ├── StatusView.swift
│       │   ├── PrepView.swift
│       │   ├── WeatherView.swift
│       │   ├── SuppliesView.swift
│       │   ├── ChecklistsView.swift
│       │   ├── MapView.swift + OfflineTileMapView.swift
│       │   ├── CommsView.swift
│       │   ├── IntelView.swift
│       │   ├── SettingsView.swift
│       │   ├── DetailView.swift
│       │   ├── AddForms.swift
│       │   ├── DownloadControl.swift
│       │   └── SharedComponents.swift
│       └── Assets.xcassets/       # App icon, accent color
│
├── rork.json                      # Rork project configuration
└── README.md                      # You are here
```

## Prerequisites

- **Node.js** 18+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- **Bun** 1.1+ ([install](https://bun.sh/docs/installation))
- **Xcode** 16+ (for iOS native app development & simulator)
- **Expo Go** app on your physical device (for testing) — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

### 1. Clone

```bash
git clone <YOUR_GIT_URL>
cd GRIDDOWN
```

### 2. Install Expo app dependencies

```bash
cd expo
bun install
```

### 3. iOS native app (optional)

The SwiftUI app in `ios/` does not require dependency installation — it uses only Apple frameworks. Open the Xcode project directly:

```bash
open ios/GRIDDOWN.xcodeproj
```

## Running the App

### Expo (React Native)

```bash
cd expo

# Start the dev server
bun run start

# Press "i" to open iOS Simulator
# Press "a" to open Android Emulator
# Scan QR code with Expo Go for physical device testing

# Web preview
bun run start-web

# With tunnel (if not on same network)
bun run start -- --tunnel
```

### iOS (SwiftUI)

1. Open `ios/GRIDDOWN.xcodeproj` in Xcode
2. Select a simulator (iPhone 15 Pro or later recommended)
3. Press `Cmd+R` to build and run

## Building for Production

### Expo → App Store / Google Play

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure
cd expo
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

See the [Expo deployment guide](https://docs.expo.dev/submit/introduction/) for full instructions.

### iOS (SwiftUI) → App Store

1. Open the project in Xcode
2. Select your development team in Signing & Capabilities
3. Archive the build (`Product → Archive`)
4. Distribute via TestFlight or submit to App Store Connect

## Configuration

### Environment Variables

Public environment variables are pre-configured for the Rork toolkit and are safe to read in client code:

```bash
# Expo (client-side, prefixed with EXPO_PUBLIC_)
EXPO_PUBLIC_PROJECT_ID
EXPO_PUBLIC_RORK_API_BASE_URL
EXPO_PUBLIC_RORK_APP_KEY
EXPO_PUBLIC_RORK_AUTH_URL
EXPO_PUBLIC_RORK_FUNCTIONS_URL
EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY
EXPO_PUBLIC_TEAM_ID
EXPO_PUBLIC_TOOLKIT_URL
```

> **Never commit `.env` files.** The `.gitignore` already excludes them. Add your own `.env.local` for development.

### iOS Permissions

The iOS app requests the following permissions:

- **Location** (`NSLocationWhenInUseUsageDescription`) — for weather lookup and map user location

These are configured via `INFOPLIST_KEY_*` entries in `project.pbxproj` (no separate Info.plist file).

## Data & Persistence

### Expo App
All app data is stored locally via `AsyncStorage` through a centralized `AppProvider` context hook. Data includes: alert level, group name, check-in cadence, reminder settings, members, supplies, checklists, POIs, routes, comms channels, repeaters, and saved Kiwix resources. Seed content (new checklists, supplies, POIs) is merged into existing installs on version bumps, so updates never wipe user data. Downloaded ZIM files and offline map packs live in the app's documents directory.

### iOS App
All app data is stored in `UserDefaults` through an `@Observable AppStore` class. The store provides full CRUD operations for all entity types, computed statistics (supply stats, readiness counts), and automatic persistence on every mutation. Local notifications are scheduled through `UserNotifications` and rescheduled on relevant mutations.

### Ops Backups
Export produces a versioned `griddown-ops-backup` JSON (identical format on both platforms) shared via the system share sheet on mobile or copied to the clipboard on web. Import accepts either a wrapped backup file or raw app-data JSON and replaces all data after confirmation.

### Weather API
Weather data is fetched from [Open-Meteo](https://open-meteo.com/), a free open-source weather API that requires no API key or authentication. The API provides current conditions, hourly forecasts, and daily forecasts. If the device is offline, the app gracefully shows the cached snapshot with an OFFLINE chip, or an error state if nothing is cached.

## Key Design Decisions

- **Offline-first architecture** — No backend dependency for core functionality. All data persists locally.
- **Two parallel implementations** — Expo/React Native for cross-platform reach, SwiftUI for native iOS polish. Both share the same feature set and design language.
- **Dark tactical theme** — Optimized for field use and night operations. Olive (#6B7A4A) and orange (#D4822A) accents on a deep charcoal (#1A1D1A) canvas.
- **Lazy-loaded native modules** — `react-native-maps` and `expo-location` are loaded via `require()` only on native platforms to keep web builds clean.
- **Type-safe navigation** — iOS uses a `NavRoute` enum with `NavigationLink(value:)` + `.navigationDestination(for:)`. Expo uses Expo Router's file-based routing with typed routes.
- **No external API keys** — Weather uses Open-Meteo (free, no auth). No third-party services required.

## Contributing

Contributions are welcome. Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run checks (see below)
5. Commit with a clear message
6. Open a Pull Request

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add supply expiration reminders
fix: resolve map annotation tap target on iOS 18
docs: update README with deployment steps
refactor: extract shared form components
chore: bump expo-location to 19.0.8
```

### Before Opening a PR

**Expo app:**
```bash
cd expo
bun run lint          # ESLint
bunx tsc --noEmit     # TypeScript type check
```

**iOS app:**
- Build in Xcode (`Cmd+B`) — ensure zero warnings and zero errors
- Test on at least one simulator (iPhone 15 Pro or later)
- Verify all navigation paths and add/edit flows work

### Code Style

- **TypeScript:** Strict mode, explicit type annotations, no `any`
- **Swift:** MVVM architecture, `@Observable` for state, `let` over `var`, modern SwiftUI APIs
- **Both:** Self-documenting code, minimal comments, JSDoc/SwiftDoc for exported APIs

### Pull Request Checklist

- [ ] Code compiles without errors or warnings
- [ ] Linting passes (`bun run lint` for Expo)
- [ ] No secrets, API keys, or sensitive data committed
- [ ] Feature works on both platforms (if applicable)
- [ ] UI follows the existing dark tactical theme
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains what changed and why

## Troubleshooting

<details>
<summary><b>App not loading on device</b></summary>

1. Ensure your phone and computer are on the same WiFi network
2. Try tunnel mode: `bun run start -- --tunnel`
3. Clear cache: `bunx expo start --clear`
4. Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
</details>

<details>
<summary><b>Map not rendering (Expo web)</b></summary>

`react-native-maps` is lazy-loaded only on native platforms. The web preview shows a placeholder. Test the map on a native simulator or physical device.
</details>

<details>
<summary><b>Weather not loading</b></summary>

1. Ensure location permissions are granted
2. Check internet connectivity (Open-Meteo API requires network)
3. The app shows an error state gracefully if the API is unreachable
</details>

<details>
<summary><b>iOS build errors in Xcode</b></summary>

1. Clean build folder: `Cmd+Shift+K`
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/GRIDDOWN-*`
3. Ensure deployment target is set to iOS 18+
4. Verify your development team is selected in Signing & Capabilities
</details>

<details>
<summary><b>TypeScript errors</b></summary>

```bash
cd expo
bunx tsc --noEmit    # Check for type errors
bun run lint          # Check for lint errors
```
</details>

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Open-Meteo](https://open-meteo.com/) — Free weather API, no key required
- [Expo](https://expo.dev/) — React Native framework and tooling
- [Kiwix](https://www.kiwix.org/) — Offline content reader and open educational resources
- [Lucide](https://lucide.dev/) — Open-source icon library
- [SF Symbols](https://developer.apple.com/sf-symbols/) — Apple's icon system (iOS app)

---

<div align="center">

**GRIDDOWN** — Stay ready. Stay connected. Stay alive.

Built with [Rork](https://rork.com)

</div>
