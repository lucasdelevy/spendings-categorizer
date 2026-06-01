# Aletheia iOS

Expo React Native app for Spendings Categorizer (Aletheia).

## Setup

```bash
cp .env.example .env
# Fill in EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (Google Cloud → iOS OAuth client)
npm install   # from repo root (npm workspaces)
```

## Development (Expo Go)

```bash
cd ios
npm start
# Press i for iOS simulator
```

Google Sign-In requires a valid iOS OAuth client ID matching `app.json` → `ios.bundleIdentifier` (`dev.lucasdelevy.aletheia`).

## Standalone build on a connected iPhone

Requires Xcode, an Apple Developer account, and a USB-connected device.

### 1. Prebuild native project

```bash
cd ios
npx expo prebuild --platform ios --clean
```

This generates `ios/ios/` (native Xcode project inside the Expo folder).

### 2. Open in Xcode

```bash
open ios/Aletheia.xcworkspace
```

### 3. Configure signing

1. Select the **Aletheia** target → **Signing & Capabilities**
2. Choose your **Team**
3. Ensure **Bundle Identifier** is `dev.lucasdelevy.aletheia` (or update Google OAuth + `app.json` to match)

### 4. Build and run on device

1. Connect iPhone via USB
2. Select your device in the Xcode toolbar
3. **Product → Run** (⌘R)
4. Trust the developer certificate on the device if prompted (**Settings → General → VPN & Device Management**)

### 5. Google OAuth on device

In [Google Cloud Console](https://console.cloud.google.com/):

- Create an **iOS** OAuth client with bundle ID `dev.lucasdelevy.aletheia`
- Add the reversed client ID as a URL scheme in `app.json` if using native Google Sign-In
- Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env`

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Metro cannot resolve `@aletheia/shared` | Run `npm install` from **repo root** |
| 401 on API calls | Check `EXPO_PUBLIC_API_URL` and sign in again |
| Google Sign-In fails on device | Verify iOS client ID and bundle ID match |

## Project structure

```
ios/
├── App.tsx              # Entry + providers
├── src/
│   ├── auth/            # API client, AuthContext, Google Sign-In
│   ├── components/      # Dashboard UI
│   ├── hooks/           # Data hooks
│   ├── i18n/            # EN / PT-BR
│   ├── navigation/      # Drawer navigator
│   ├── screens/         # All app screens
│   └── theme/           # Dark / light mode
└── app.json             # Expo config (icon, splash, bundle ID)
```
