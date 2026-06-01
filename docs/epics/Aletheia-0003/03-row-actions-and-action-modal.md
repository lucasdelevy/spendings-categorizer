# Task 03 — Row action buttons and TransactionActionModal

**Epic:** [Aletheia-0003](./Aletheia-0003.md)  
**Status:** Not started  
**Depends on:** [02-horizontal-scroll-table-rows.md](./02-horizontal-scroll-table-rows.md)

## Description

Replace the current "tap anywhere on the row → minimal bottom sheet" pattern with inline action buttons matching web, and port the full `TransactionActionModal` for recategorize / rename / ignore.

Web per-row actions (rightmost column):

- **Hide / unhide** — eye icon button; calls `onHide({ globalIndex })` immediately
- **Tag** — opens `TransactionActionModal` for recategorize, rename, ignore (only when remote/saved data and handlers provided)

iOS today opens a bare modal on any row press with simple `TextInput` fields. The web modal includes category picker, color for new categories, "apply to similar" option, and proper labeled actions.

Create `ios/src/components/TransactionActionModal.tsx` by porting `web/src/components/TransactionActionModal.tsx` to React Native (use existing `TextField`, `Button`, `FilterChip` from `ui/`).

Remove full-row `Pressable` wrapper; only action buttons and optional merchant long-press for accessibility should trigger modals.

## Acceptance criteria

- [ ] Hide/unhide icon button on each row when `onHide` is provided; toggles without opening modal.
- [ ] Tag icon button opens `TransactionActionModal` when action handlers are available.
- [ ] Modal supports recategorize (with category list / new category), rename, ignore — matching web fields.
- [ ] Modal uses shared UI components; adequate touch targets (44pt).
- [ ] Row tap no longer opens the old bottom sheet by default.
- [ ] Action buttons reachable after horizontal scroll on narrow screens.
- [ ] i18n keys for `table.hide`, `table.unhide`, `table.actions`, and modal copy present in iOS locale files.

## Reference

- Web: `web/src/components/TransactionTable.tsx` (action buttons in `TransactionRow`)
- Web: `web/src/components/TransactionActionModal.tsx`
- iOS: `ios/src/components/TransactionTable.tsx`
