# Aletheia-0003 — iOS Transaction Table Parity

**Status:** Not started  
**Priority:** High  
**Depends on:** [Aletheia-0002](../Aletheia-0002/Aletheia-0002.md) (dashboard charts, filters, shared UI)

## Summary

Aletheia-0002 brought the dashboard charts, filter card, and tab styling in line with web. The **transaction list itself** is still a simplified iOS `SectionList`: flat category headers, two-line rows (payee + raw date), and a bottom-sheet modal opened by tapping the whole row.

The web `TransactionTable` is a different experience: collapsible category cards, spending-limit progress in the header, a proper columnar table inside each card, horizontally scrollable rows on narrow screens, per-row action buttons, and richer metadata (avatar, formatted date, bank/card badge, account chip, installment, API/CSV origin).

This epic closes that gap.

## iOS vs web gaps (transaction table)

| Area | Web | iOS today |
|------|-----|-----------|
| Category layout | Collapsible card per category; chevron + `{count}x` badge | Always-expanded `SectionList` section headers |
| Limit progress | Progress bar + "of limit / exceeded" in category header | Text-only `· 104%` suffix on subtitle |
| Row layout | Table columns: avatar, date, source, merchant, amount, installment | Dot + payee + ISO date + amount; payee truncated |
| Horizontal scroll | `overflow-x-auto` table (`min-w-[600px]`) reveals full row | No horizontal scroll; information clipped |
| Row actions | Hide/unhide eye icon + tag icon per row (no full-row tap) | Entire row opens modal |
| Action modal | Dedicated `TransactionActionModal` with full recategorize flow | Minimal bottom sheet with bare inputs |
| All mode | Flat sortable table with category column | Single section titled "All" with same minimal rows |
| Hidden txs | Shown dimmed with line-through; counted in header badge | Filtered out of list (`!tx.hidden`) |
| Account badge | Merchant cell shows linked account name chip | Not shown |
| Source badge | Bank / Card pill on family statements | Not shown |

## Out of scope

- New backend endpoints or transaction fields.
- Swipe-to-action gestures (optional follow-up; web uses tap buttons).
- Android.

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Collapsible category cards and limit progress | [01-collapsible-category-cards.md](./01-collapsible-category-cards.md) | Not started |
| 2 | Horizontal-scroll table rows with full columns | [02-horizontal-scroll-table-rows.md](./02-horizontal-scroll-table-rows.md) | Not started |
| 3 | Row action buttons and TransactionActionModal | [03-row-actions-and-action-modal.md](./03-row-actions-and-action-modal.md) | Not started |

## Suggested implementation order

1. **Cards (1):** Replace `SectionList` section headers with collapsible category cards matching web accordion behavior.
2. **Rows (2):** Introduce table header + horizontally scrollable row component; wire into both **By Category** (expanded) and **All** modes.
3. **Actions (3):** Add inline hide + tag buttons; port `TransactionActionModal` from web.

## Web reference files

- `web/src/components/TransactionTable.tsx` — accordion, rows, columns, expand state
- `web/src/components/TransactionActionModal.tsx` — recategorize / rename / ignore modal

## iOS files to update

- `ios/src/components/TransactionTable.tsx` — primary rewrite
- `ios/src/components/TransactionActionModal.tsx` — new (port from web)
- `ios/src/components/ui/` — optional `CategoryCard`, `TransactionRow` subcomponents
- `ios/src/i18n/en.ts` / `pt-BR.ts` — ensure `table.*` keys exist (copy from web if missing)

## UX parity checklist

- [ ] By Category: each category renders as a bordered card with tap-to-expand/collapse
- [ ] Category header shows color dot, name, `{count}x` badge, total (green/red), chevron
- [ ] Category header shows limit progress bar when a spending limit is configured
- [ ] Expanded category reveals a table with column headers (date, source, merchant, amount, installment when applicable)
- [ ] Table scrolls horizontally on iPhone so full merchant name and actions are reachable
- [ ] Each row shows uploader avatar (when family data present), formatted locale date, source badge, account chip, origin label
- [ ] Hide and tag action buttons visible per row; row tap does not hijack the whole row
- [ ] Hidden transactions visible but dimmed; hidden count badge on category header
- [ ] All mode: flat date-sorted table with category column, same row layout and horizontal scroll
- [ ] `TransactionActionModal` matches web recategorize / rename / ignore flows
- [ ] Light and dark mode verified on physical device
