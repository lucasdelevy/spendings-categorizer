# Shipping Aletheia to the App Store

Use this after a **paid** Apple Developer Program membership is Active (not only a free Apple ID). Team ID in this repo: `B2P4VVXRT2`. Bundle ID: `com.lucasdelevy.aletheia`.

Privacy policy URL (after the web app is deployed from `main`):

`https://lucasdelevy.github.io/spendings-categorizer/privacy.html`

## What is already done in the repo

- App Store-oriented Expo config in `ios/app.json`: production push entitlement, iPhone-only (no iPad screenshot set), encryption exemption, privacy manifest for email / name / user id / device token / financial data.
- Native copy updated for the current Xcode project: production `aps-environment`, `ITSAppUsesNonExemptEncryption`, `TARGETED_DEVICE_FAMILY = 1`.
- Export options: `ios/store/ExportOptions.plist`.
- Marketing icon is 1024×1024 PNG **without alpha** (Apple rejects transparency on the store icon).

## Blocking items you must finish (Apple will reject otherwise)

### 1. Confirm the paid program, not just an Apple ID

1. Open [developer.apple.com/account](https://developer.apple.com/account).
2. Membership should say **Apple Developer Program** and **Active**. Enrollment can take 24–48 hours after payment.
3. In Xcode: **Settings → Accounts** → your Apple ID → the team **Lucas Oliveira (B2P4VVXRT2)** should show **Agent** (or Admin), not only a personal team with a 7-day signing limit.

This Mac currently has only an **Apple Development** certificate (`Apple Development: Lucas Oliveira`). An **Apple Distribution** certificate is created the first time you Archive with automatic signing on a paid team.

### 2. Enable Sign in with Apple on the App ID

Guideline 4.8: Google Sign-In on iOS requires **Sign in with Apple** as an equivalent option. Native iOS does **not** need a Services ID or a Sign in with Apple key (those are for web). Only the App ID capability.

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → App ID **com.lucasdelevy.aletheia**.
2. Enable **Sign in with Apple** → Save. If Xcode asks to add the capability on the next Archive, accept.
3. Confirm `ios/ios/Aletheia/Aletheia.entitlements` contains `com.apple.developer.applesignin` = `Default`.

The login screen shows Apple above Google. Web stays Google-only.

Google and Apple accounts that share the same email become one Aletheia user. Hide My Email (`@privaterelay.appleid.com`) will **not** match a Gmail family invite.

### 3. Account deletion is implemented (Guideline 5.1.1(v))

Do not submit until this backend is **deployed** (CDK: new `POST /auth/apple` and `DELETE /auth/me` routes).

- iOS and web: **Delete account** in the side menu, with a confirmation.
- Backend: `DELETE /auth/me` removes `USER#<id>` (profile, sessions, devices, solo statements, category config, accounts, limit alerts) and `EMAILUSER#<email>`. Family: remaining members keep the group (a successor is promoted if you were the owner); a sole remaining owner dissolves the family.

Privacy policy (`web/public/privacy.html`) documents in-app deletion.

### 4. Create the app in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → + → New App**.
2. Platform: **iOS**.
3. Name: **Aletheia** (must be unique; add a subtitle if the name is taken).
4. Primary language: **English** or **Portuguese (Brazil)** — you can add the other locale later.
5. Bundle ID: select **com.lucasdelevy.aletheia**. If it is missing, create it first under [Identifiers](https://developer.apple.com/account/resources/identifiers/list) (App ID, explicit, Push Notifications enabled).
6. SKU: e.g. `aletheia-ios` (internal, never shown to users).
7. User access: Full Access.

Also create an **iOS Distribution** provisioning profile only if you are not using Xcode automatic signing. Automatic signing is what this project uses.

### 5. App Store listing content

Fill these on the app record before you can submit:

| Field | Suggested value |
| --- | --- |
| Privacy Policy URL | `https://lucasdelevy.github.io/spendings-categorizer/privacy.html` |
| Category | **Finance** |
| Age rating | Complete the questionnaire; this is a finance utility, not 18+ unless you declare otherwise |
| Copyright | `© 2026 Lucas de Levy Oliveira` |
| Support URL | A page you control (GitHub repo, or the Pages site) |
| Marketing URL | optional |
| Description | Short pitch: personal / family spending categorizer, Open Finance + CSV, categories and limits |
| Keywords | spending, budget, categorias, extrato, open finance, … (100 character cap) |
| What’s New | `Initial release.` |
| Review notes | Explain Google Sign-In **and** Sign in with Apple on iOS. Provide a demo Google account. Say the user can delete the account from the side menu. Open Finance keys are optional. Push permission is for limit alerts. |

**Screenshots (required):** at least one **6.9-inch iPhone** set, 1–10 images.

Accepted portrait sizes: **1320×2868**, **1290×2796**, or **1260×2736**. PNG or JPEG, **no alpha**.

Practical way on the 16e:

1. Install a TestFlight or USB build.
2. Capture screens: dashboard, category cards, swipe, categories, accounts.
3. On a Mac, open each PNG in Preview. If the pixel size is not one of the three above, use a 6.9-inch simulator screenshot instead:
   - Xcode → **Window → Devices and Simulators** is not needed; run:
     `xcrun simctl list devices available | grep "iPhone 16 Pro Max"`
   - Boot that simulator, run the app, **File → Save Screen** or `xcrun simctl io booted screenshot`.
4. The 16e screenshot will **not** match 6.9-inch. Do not upload native 16e pixels unless you resize/canvas them to an accepted size (resizing looks soft; simulator is better).

Because the app is **iPhone-only** (`supportsTablet: false`), you do **not** need iPad screenshots. If you turn tablet support back on, you also need a **13-inch iPad** set (2064×2752).

**App Privacy** questionnaire (App Store Connect → App Privacy):

- Data used to track you: **No**
- Collected: Email, Name, User ID, Device ID (push token), Other Financial Info
- Linked to identity: **Yes**
- Used for tracking: **No**
- Purposes: App Functionality

That should match `PrivacyInfo.xcprivacy`.

**Export compliance:** ITSAppUsesNonExemptEncryption is already `false` (HTTPS only). In Connect, answer that you use encryption only for HTTPS / standard OS crypto, or that the app is exempt.

### 6. Production push (after TestFlight, not for USB sideloads)

USB/devicectl builds use the **sandbox** APNs environment. TestFlight and App Store use **production**.

When you are testing from TestFlight:

1. Set Pierre Lambda env `APNS_PRODUCTION=true` (CDK / console).
2. Redeploy Pierre.
3. Reinstall from TestFlight and allow notifications.

Until then, leave `APNS_PRODUCTION=false` so the USB 16e build still gets sandbox pushes.

## Archive and upload (Xcode)

You can do this in the GUI (clearest the first time):

1. Connect to the internet. Open:

   ```bash
   open /Users/lucas/Documents/git/spendings-categorizer/ios/ios/Aletheia.xcworkspace
   ```

2. Select the **Aletheia** scheme, destination **Any iOS Device (arm64)**.
3. **Product → Archive**. Wait for the Organizer.
4. **Distribute App → App Store Connect → Upload**.
5. Automatic signing, include symbols, upload.

If Archive is greyed out, the destination is a simulator. Switch to **Any iOS Device**.

### Command-line archive (same signing)

From `spendings-categorizer/ios/ios`:

```bash
export PATH="/Users/lucas/.nvm/versions/node/v22.23.2/bin:$PATH"
xcodebuild -workspace Aletheia.xcworkspace -scheme Aletheia -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ../store/Aletheia.xcarchive \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=B2P4VVXRT2 \
  CODE_SIGN_STYLE=Automatic \
  archive
```

Then export (does **not** upload):

```bash
xcodebuild -exportArchive \
  -archivePath ../store/Aletheia.xcarchive \
  -exportPath ../store/Export \
  -exportOptionsPlist ../store/ExportOptions.plist \
  -allowProvisioningUpdates
```

Upload the IPA with **Transporter** (Mac App Store) or:

```bash
xcrun altool --upload-app --type ios \
  --file ../store/Export/Aletheia.ipa \
  --api-key YOUR_KEY_ID \
  --api-issuer YOUR_ISSUER_UUID
```

Create an App Store Connect API key: [Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api). Download the `.p8`, put it in `~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8`. Never commit it.

## After the build appears in Connect

1. App Store Connect → **TestFlight**. Wait for processing (usually under 30 minutes).
2. Add yourself as an internal tester, install TestFlight, confirm sign-in, CSV upload, Pierre, and pushes (with `APNS_PRODUCTION=true`).
3. When happy: **App Store** tab → select the build → **Add for Review** → **Submit**.

Review often takes 24–48 hours. Common first-review questions: missing demo account, missing account deletion, privacy URL down, financial-data copy that overclaims bank-level security.

## Re-prebuild warning

`npx expo prebuild --clean` regenerates `ios/ios/`. After a clean prebuild, run `npm run preios:standalone` (patches) and confirm:

- `Aletheia.entitlements` has `aps-environment` = `production` and Sign in with Apple (`com.apple.developer.applesignin`)
- `Info.plist` has `ITSAppUsesNonExemptEncryption` = false
- Device family is iPhone only

## Version bumps

Each App Store / TestFlight upload needs a **higher** `CFBundleVersion` (build number). Marketing version (`1.0.0`) can stay until you ship 1.0.1.

In `ios/app.json` increment `expo.ios.buildNumber`, then either prebuild or set `CURRENT_PROJECT_VERSION` in Xcode.
