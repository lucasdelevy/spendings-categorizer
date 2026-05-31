# Aletheia iOS

Expo React Native app for Spendings Categorizer (Aletheia).

## Setup

```bash
cp .env.example .env
# Fill in EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
npm install
```

## Development

```bash
npm start          # Expo dev server
npm run ios        # Open iOS simulator
```

## Standalone build on device

See epic task 24 (`docs/epics/Aletheia-0001/24-standalone-dev-build-on-iphone.md`).

```bash
npx expo prebuild --platform ios
open ios/Aletheia.xcworkspace   # after prebuild
```
