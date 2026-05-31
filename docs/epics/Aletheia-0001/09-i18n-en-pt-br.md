# Task 09 — i18n (EN / PT-BR)

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [05-app-shell-navigation-and-side-menu.md](./05-app-shell-navigation-and-side-menu.md)

## Description

Port internationalization to the iOS app. Reuse translation strings from `web/src/i18n/en.ts` and `web/src/i18n/pt-BR.ts` (either import into shared package or copy with sync script). Use `i18next` + `react-i18next` or `expo-localization` + compatible setup.

## Acceptance criteria

- [ ] All user-facing strings go through i18n (no hardcoded English in components).
- [ ] Language switcher in side menu settings section.
- [ ] Language preference persisted locally.
- [ ] BRL currency formatting matches web (`formatBRL`, locale-aware dates).
