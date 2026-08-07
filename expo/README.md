# GRIDDOWN — Expo App

The full project README lives at the repository root: [../README.md](../README.md)

## Quick Start

```bash
cd expo
bun install
bun run start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

## Scripts

| Script | Description |
|--------|-------------|
| `bun run start` | Start Expo dev server |
| `bun run start-web` | Start web preview |
| `bun run lint` | Run ESLint |

## Key Files

- `app/(tabs)/_layout.tsx` — 5-tab navigation (Status, Prep, Map, Comms, Intel)
- `providers/AppProvider.tsx` — Central state management + AsyncStorage persistence
- `constants/colors.ts` — Dark tactical theme colors
- `types/index.ts` — All TypeScript type definitions
- `mocks/` — Seed data (members, checklists, comms, POIs, guides, Kiwix resources)
