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

Google Sign-In requires a valid iOS OAuth client ID matching `app.json` → `ios.bundleIdentifier` (`com.lucasdelevy.aletheia`).

## App Store

Paid Developer Program + App Store Connect listing, screenshots, and archive/upload: see [docs/APP_STORE.md](../docs/APP_STORE.md).

## Standalone build on a connected iPhone

Requires Xcode, an Apple Developer account, and a USB-connected device.

### 1. Prebuild native project

From the **Expo app folder** (`spendings-categorizer/ios/` — your prompt should end in `.../ios`, not `.../ios/ios`):

```bash
cd /path/to/spendings-categorizer/ios
# Do NOT run `cd ios` again — you are already in the Expo project root.

# If prebuild fails fetching the template (npm E401 / always-auth), use the public registry:
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ npx expo prebuild --platform ios --clean
```

This generates the **native** Xcode project at `./ios/` inside the Expo folder (full path: `spendings-categorizer/ios/ios/`).

### 2. Open in Xcode

```bash
open ios/Aletheia.xcworkspace
```

(Run that from `spendings-categorizer/ios/`, not from the repo root.)

### 3. Configure signing

1. Select the **Aletheia** target → **Signing & Capabilities**
2. Choose your **Team**
3. Ensure **Bundle Identifier** is `com.lucasdelevy.aletheia` (or update Google OAuth + `app.json` to match)

### 4. Build and run on device

1. Connect iPhone via USB
2. Select your device in the Xcode toolbar
3. **Product → Run** (⌘R)
4. Trust the developer certificate on the device if prompted (**Settings → General → VPN & Device Management**)

### 5. Google OAuth on device

In [Google Cloud Console](https://console.cloud.google.com/):

- Create an **iOS** OAuth client with bundle ID `com.lucasdelevy.aletheia`
- Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` (web ID = same as `VITE_GOOGLE_CLIENT_ID`)
- Add the iOS client ID to the backend: GitHub secret `GOOGLE_IOS_CLIENT_ID`, or comma-separate both IDs in `GOOGLE_CLIENT_ID`, then redeploy backend

### 6. Push notifications

Limit-breach pushes need an Apple Push (APNs) auth key on the Pierre Lambda:

1. In [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list), create a key with **Apple Push Notifications service (APNs)** enabled.
2. Download the `.p8` once, then set GitHub secrets (or local env vars for `cdk deploy`):
   - `APNS_KEY_ID` — the 10-character Key ID
   - `APNS_TEAM_ID` — `B2P4VVXRT2`
   - `APNS_BUNDLE_ID` — `com.lucasdelevy.aletheia`
   - `APNS_KEY_P8` — the `.p8` PEM, or base64 of the file
   - `APNS_PRODUCTION` — `false` for local Xcode/devicectl installs (sandbox); `true` for TestFlight/App Store
3. Redeploy infra so Pierre picks up the env vars.
4. On first launch after sign-in, allow notifications when iOS prompts.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Metro cannot resolve `@aletheia/shared` | Run `npm install` from **repo root** |
| 401 / "Unauthorized" on sign-in | Backend must accept the iOS OAuth client ID (`GOOGLE_IOS_CLIENT_ID`); rebuild app after updating `.env` |
| 401 on API calls | Check `EXPO_PUBLIC_API_URL` and sign in again |
| Google Sign-In fails on device | Verify iOS client ID and bundle ID match |
| `npm view expo-template-bare-minimum` E401 | Run prebuild with `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/` |
| `cd: no such file or directory: ios` | You're already in `spendings-categorizer/ios`; skip the extra `cd ios` |

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
