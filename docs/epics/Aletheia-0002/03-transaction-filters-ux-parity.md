# Task 03 — Transaction filters UX parity

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Not started  
**Depends on:** [05-shared-form-inputs-and-buttons.md](./05-shared-form-inputs-and-buttons.md)

## Description

Bring iOS transaction filters up to web quality. Today, filters are toggled by a plain text link and expose four unstyled `TextInput` fields (min/max amount, from/to date) with low-contrast placeholders and no section labels.

The web `TransactionFilters` component provides:

- Bordered card container with padding
- Labeled **Amount** section (min — max side by side)
- Labeled **Date** section with preset pills (`1d`, `2d`, `3d`, `5d`) and a **Custom** toggle
- Inline calendar for custom date range selection
- **Member** chips with avatars when family uploads are present (`uploadedBy`)
- **Clear filters** action when any filter is active
- Filters always visible on web (not collapsed); consider a collapsible panel on iOS if space is tight, but styling must match

Extract filters from `TransactionTable.tsx` into a dedicated `TransactionFilters.tsx` component mirroring the web structure. Reuse shared filter logic from `@aletheia/shared` where possible (`parseDateToNum`, `matchesFilters` patterns).

## Acceptance criteria

- [ ] Filter UI lives in `ios/src/components/TransactionFilters.tsx` (or equivalent).
- [ ] Amount range inputs have visible labels and styled borders matching theme.
- [ ] Date presets (1d, 2d, 3d, 5d) work and highlight when active.
- [ ] Custom date range uses a native-friendly calendar/date picker (not raw ISO text fields).
- [ ] Owner/member filter chips shown when transactions have `uploadedBy` metadata.
- [ ] "Clear filters" resets all fields when any filter is active.
- [ ] Filtered results update category totals and counts in real time (existing behavior preserved).
- [ ] Filter toggle (if kept collapsible) uses button styling, not bare text.
- [ ] Placeholder and label contrast meets readability in light and dark mode.

## Reference

- Web: `web/src/components/TransactionFilters.tsx`
- iOS: `ios/src/components/TransactionTable.tsx` (inline filter block)
