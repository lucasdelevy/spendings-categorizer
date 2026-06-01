# Task 24 — Standalone dev build on connected iPhone

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [07-google-sign-in-on-ios.md](./07-google-sign-in-on-ios.md), [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md)

## Description

Configure Expo Dev Client / prebuild and produce a standalone iOS build installable on a physical iPhone connected via USB. Document the workflow using Expo CLI + Xcode (signing team, bundle ID, provisioning).

## Acceptance criteria

- [ ] `npx expo prebuild --platform ios` generates native project.
- [ ] Xcode opens project; build succeeds with development team configured.
- [ ] App installs and launches on connected iPhone.
- [ ] Google Sign-In works on device (not just simulator).
- [ ] README section in `ios/README.md` documents step-by-step setup.

## Prerequisites

- Apple Developer account (or personal team for device testing).
- Google iOS OAuth client with correct bundle ID and URL scheme.
