# Task 10 — Dark mode and theme

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [05-app-shell-navigation-and-side-menu.md](./05-app-shell-navigation-and-side-menu.md)

## Description

Implement dark/light theme equivalent to `web/src/theme/ThemeContext.tsx`. Respect system `prefers-color-scheme` as default; allow manual override via toggle in the side menu (matching `DarkModeToggle`).

## Acceptance criteria

- [ ] Theme preference persisted (AsyncStorage).
- [ ] All screens and components styled for light and dark.
- [ ] Charts and modals readable in both themes.
- [ ] Toggle labeled in both EN and PT-BR.
