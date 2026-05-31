# Aletheia-0001 — Launch iOS App

**Status:** Not started  
**Priority:** High

## Summary

Restructure the repository into a monorepo (`web/`, `ios/`, `backend/`, `infra/`) and build a React Native iOS app with Expo that reaches feature parity with the existing web app. The iOS app connects to the same AWS backend and runs as a standalone build on a physical iPhone via Expo and Xcode.

## Goals

- Move the Vite React frontend from repo root into `web/` without breaking GitHub Pages deploys.
- Scaffold `ios/` as an Expo (React Native) project for iOS.
- Port every current web feature to native UI patterns appropriate for mobile.
- Reuse categorization engine logic and share types where practical.
- Ship a dev/standalone build installable on a connected iPhone.

## Out of scope

- Android build (future epic).
- App Store / TestFlight submission (future epic).
- New backend features not already available to the web app.
- Offline-first caching (tracked separately in `docs/BACKLOG.md`).

## Architecture notes

```
spendings-categorizer/
├── web/          # Existing Vite + React app (moved from root)
├── ios/          # Expo React Native app (new)
├── backend/      # Unchanged Lambda handlers
├── infra/        # CDK — add mobile CORS origins as needed
└── docs/epics/
```

The iOS app uses the same API Gateway endpoints documented in `docs/ARCHITECTURE.md`. Client-side CSV parsing and categorization run on-device before save, matching the web flow.

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Move web app to `web/` folder | [01-move-web-app-to-web-folder.md](./01-move-web-app-to-web-folder.md) | Done |
| 2 | Update CI/CD and docs for monorepo layout | [02-update-cicd-and-docs-for-monorepo.md](./02-update-cicd-and-docs-for-monorepo.md) | Done |
| 3 | Initialize Expo project in `ios/` | [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md) | Done |
| 4 | Extract shared engine and types package | [04-extract-shared-engine-and-types.md](./04-extract-shared-engine-and-types.md) | Done |
| 5 | App shell, navigation, and side menu | [05-app-shell-navigation-and-side-menu.md](./05-app-shell-navigation-and-side-menu.md) | Done |
| 6 | API client and secure token storage | [06-api-client-and-secure-token-storage.md](./06-api-client-and-secure-token-storage.md) | Done |
| 7 | Google Sign-In on iOS | [07-google-sign-in-on-ios.md](./07-google-sign-in-on-ios.md) | Done |
| 8 | Backend CORS for mobile clients | [08-backend-cors-for-mobile-clients.md](./08-backend-cors-for-mobile-clients.md) | Done |
| 9 | i18n (EN / PT-BR) | [09-i18n-en-pt-br.md](./09-i18n-en-pt-br.md) | Done |
| 10 | Dark mode and theme | [10-dark-mode-and-theme.md](./10-dark-mode-and-theme.md) | Done |
| 11 | Dashboard — month selector and remote data loading | [11-dashboard-month-selector-and-data-loading.md](./11-dashboard-month-selector-and-data-loading.md) | Done |
| 12 | CSV upload and local preview | [12-csv-upload-and-local-preview.md](./12-csv-upload-and-local-preview.md) | Done |
| 13 | Save statement flow | [13-save-statement-flow.md](./13-save-statement-flow.md) | Not started |
| 14 | Summary bar and spending limits | [14-summary-bar-and-spending-limits.md](./14-summary-bar-and-spending-limits.md) | Not started |
| 15 | Spending charts (category pie + daily) | [15-spending-charts-category-pie-and-daily.md](./15-spending-charts-category-pie-and-daily.md) | Not started |
| 16 | Transaction table (all + by category) | [16-transaction-table-all-and-by-category.md](./16-transaction-table-all-and-by-category.md) | Not started |
| 17 | Transaction filters | [17-transaction-filters.md](./17-transaction-filters.md) | Not started |
| 18 | Transaction actions (recategorize, rename, ignore, hide) | [18-transaction-actions.md](./18-transaction-actions.md) | Not started |
| 19 | Categories page | [19-categories-page.md](./19-categories-page.md) | Not started |
| 20 | Accounts page | [20-accounts-page.md](./20-accounts-page.md) | Not started |
| 21 | Family page | [21-family-page.md](./21-family-page.md) | Not started |
| 22 | Manage months (saved statements) | [22-manage-months-saved-statements.md](./22-manage-months-saved-statements.md) | Not started |
| 23 | About page | [23-about-page.md](./23-about-page.md) | Not started |
| 24 | Standalone dev build on connected iPhone | [24-standalone-dev-build-on-iphone.md](./24-standalone-dev-build-on-iphone.md) | Not started |
| 25 | App icon, splash screen, and polish | [25-app-icon-splash-and-polish.md](./25-app-icon-splash-and-polish.md) | Not started |

## Suggested implementation order

1. **Foundation (1–4):** Monorepo move, CI, Expo scaffold, shared package.
2. **Platform (5–10):** Shell, auth, API, i18n, theme.
3. **Dashboard (11–18):** Core spending workflow — the highest-value user path.
4. **Settings pages (19–23):** Categories, accounts, family, manage months, about.
5. **Ship (24–25):** Device build and visual polish.

## Web feature parity checklist

- [ ] Google OAuth login / logout
- [ ] Dashboard with month selector
- [ ] CSV upload (bank + card, family merge, dedup)
- [ ] Save processed statement to backend
- [ ] Summary bar (in/out/balance/counts/limits exceeded)
- [ ] Category spending limit breach banner
- [ ] Category pie chart + daily spending chart
- [ ] Transaction table — all transactions tab
- [ ] Transaction table — by category tab
- [ ] Transaction filters (amount, date, owner)
- [ ] Recategorize / rename / ignore / hide transactions
- [ ] Categories management (keywords, colors, limits, ignore, rename)
- [ ] Bank accounts & cards CRUD (incl. closing day, API key hint)
- [ ] Family create / invite / remove members
- [ ] Manage months — view, delete, assign account
- [ ] About page with feature log
- [ ] EN / PT-BR language switcher
- [ ] Dark mode toggle
- [ ] Side menu navigation
