# Mobile App Notes

## Why Mobile Instead of Web?

The original spec mentioned React 18 + Vite (web). This project targets **mobile first** because:
- Club members are students — they live on their phones
- Task notifications work better as push notifications
- Leaderboard engagement is higher on mobile

## Planned Stack (Phase 3)

| Tool | Purpose |
|------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Build toolchain, OTA updates |
| TypeScript | Type safety |
| React Navigation v6 | Screen routing |
| TanStack Query (React Query) | Server state management |
| Axios | HTTP client |
| AsyncStorage | Token persistence |
| Expo Notifications | Push notifications (Phase 4) |

## Backend Compatibility

The FastAPI backend is **already mobile-compatible** — it's a pure JSON API. No changes needed. The mobile app will:
1. Call the same endpoints documented in `04-API-ENDPOINTS.md`
2. Store JWT in AsyncStorage (equivalent of localStorage)
3. Attach `Authorization: Bearer <token>` to every request
4. Replace stored token when create/join club returns a new one

## Screen Map (Draft)

```
Auth Stack (no token)
├── Login Screen
├── Register Screen
└── Onboarding Screen

Main Stack (has token, no club)
├── Create Club Screen
└── Join Club Screen

Club Stack (has token + club_id)
├── Dashboard (club details + leaderboard)
├── Members List
├── Tasks List (Phase 2)
├── Task Detail (Phase 2)
└── Profile / Settings
```
