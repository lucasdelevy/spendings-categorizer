# Task 03 — Initialize Expo project in `ios/`

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [01-move-web-app-to-web-folder.md](./01-move-web-app-to-web-folder.md)

## Description

Scaffold a new Expo (React Native) project in `ios/` using TypeScript. Configure for iOS development with Expo Dev Client support so native modules (Google Sign-In, secure storage) can be added later.

## Acceptance criteria

- [ ] `ios/` contains a working Expo app (`npx expo start`).
- [ ] TypeScript configured; ESLint/Prettier aligned with repo conventions.
- [ ] iOS simulator launches the placeholder home screen.
- [ ] `.env.example` documents required env vars (`EXPO_PUBLIC_API_URL`, Google client IDs).
- [ ] `ios/` added to root `.gitignore` entries for build artifacts (`ios/build`, `.expo`, etc.).
