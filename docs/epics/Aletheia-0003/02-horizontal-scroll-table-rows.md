# Task 02 — Horizontal-scroll table rows with full columns

**Epic:** [Aletheia-0003](./Aletheia-0003.md)  
**Status:** Not started  
**Depends on:** [01-collapsible-category-cards.md](./01-collapsible-category-cards.md)

## Description

Port the web table row layout to React Native so each transaction exposes the same columns and can be scrolled sideways on a phone to read the full merchant name and reach action buttons.

Web rows (`TransactionRow`) include:

| Column | When shown |
|--------|------------|
| Uploader avatar | Family statements with `uploadedBy.picture` |
| Date | Always; locale-formatted (`DD/MM/YYYY`) |
| Source badge | Family mode — Bank / Card pill |
| Merchant / payee | Always; with optional account name chip |
| Category | All mode only |
| Amount | Always; tabular nums, green/red |
| Installment | Card or family mode |
| Actions | Task 03 |

Implementation approach:

- Wrap each table in a horizontal `ScrollView` (or a single synced scroll context per card).
- Use a fixed header row with uppercase column labels (`table.date`, `table.source`, etc.).
- Set a sensible `minWidth` (~600pt) on the inner row container so columns don't crush together.
- Port `formatDate` helper from web using `resolveLocale()`.
- Build `accountNameMap` from `accounts` prop (already passed to `TransactionTable` but unused on iOS).

Apply the same row component in:

1. Expanded category cards (`byCategory` mode)
2. Flat `all` mode table (date-sorted via `compareDatesDesc` from `@aletheia/shared`)

## Acceptance criteria

- [ ] Column header row visible above transaction rows in both modes.
- [ ] Rows scroll horizontally within the card / table container without breaking vertical list scroll.
- [ ] Date displayed in locale format, not raw `YYYY-MM-DD`.
- [ ] Source badge (bank/card) shown for family statements.
- [ ] Account name chip shown when `tx.accountId` maps to an account.
- [ ] Installment column shown for card and family statement types.
- [ ] Origin label (`API` / `CSV`) shown in actions area.
- [ ] Hidden transactions rendered with reduced opacity and strikethrough on payee/amount.
- [ ] All mode sorts rows by date descending and includes category column.
- [ ] Empty filter state shows `table.noResults` message.

## Reference

- Web: `web/src/components/TransactionTable.tsx` (`TransactionRow`, `TableHeaderRow`, `flatRows`)
- iOS: `ios/src/components/TransactionTable.tsx`
