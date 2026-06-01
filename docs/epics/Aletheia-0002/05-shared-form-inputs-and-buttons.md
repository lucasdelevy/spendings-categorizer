# Task 05 — Shared form inputs and button components

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Not started  
**Depends on:** Aletheia-0001 task 10 (theme)

## Description

Introduce reusable iOS UI primitives so filters, modals, and dashboard controls no longer rely on bare `Text` links and minimally styled `TextInput` fields. The web app uses consistent bordered inputs, pill buttons, and filled/outline actions throughout; iOS currently mixes plain text pressables with basic inputs that have faint placeholders (visible in screenshots).

Create small shared components under `ios/src/components/ui/` (or similar) that consume `useTheme()` colors.

Suggested components:

- **`TextField`** — labeled or placeholder, border, focus state, dark-mode placeholder contrast
- **`Button`** — variants: `primary` (filled), `secondary` (outline), `ghost` (text); minimum 44pt touch height
- **`SegmentedControl`** — pill container with active/inactive segments (used for transaction tabs and date presets)
- **`FilterChip`** — rounded pill for presets and owner selection

## Acceptance criteria

- [ ] `TextField` used in filter inputs and transaction action modal fields.
- [ ] `Button` used for filter toggle, modal actions (Recategorize, Rename, Ignore, Hide), and clear-filters action.
- [ ] `SegmentedControl` exported and ready for dashboard transaction tabs (wired in task 04).
- [ ] All interactive elements meet ~44pt minimum touch target.
- [ ] Components respect light/dark theme via `ThemeContext`.
- [ ] No visual regressions on screens not yet migrated (can migrate incrementally).

## Reference

- Web input/button patterns: `web/src/components/TransactionFilters.tsx`, `web/src/App.tsx`
- iOS theme: `ios/src/theme/ThemeContext.tsx`
