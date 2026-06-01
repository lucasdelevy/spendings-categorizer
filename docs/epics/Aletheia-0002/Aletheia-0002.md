# Aletheia-0002 — iOS UX Parity with Web

**Status:** Done  
**Priority:** High

## Summary

Aletheia-0001 shipped feature parity at a functional level, but the iOS dashboard UX still falls short of the web app. Charts are placeholder lists/bars instead of real visualizations, filters are bare text inputs, tabs and buttons lack proper styling, and the overall layout misses the card-based structure that makes the web app readable on mobile.

This epic closes the visual and interaction gaps so the iOS app feels as polished as the web experience shown on GitHub Pages.

## iOS vs web gaps (from dashboard comparison)

| Area | Web | iOS today |
|------|-----|-----------|
| Category chart | Donut pie chart (Recharts) + legend with % | Flat text list with colored dots; no chart |
| Daily chart | Vertical bars + cumulative line, axes, grid, tooltips | Horizontal progress bars; dates truncated to `2026-` (`date.slice(0, 5)` bug) |
| Chart container | White card with padded content and styled tab bar | Charts render inline with minimal chrome |
| Transaction tabs | Segmented pill control (`All` / `By Category`) | Plain text tabs, no background or pill styling |
| Filters | Card with labeled sections, amount range, date presets (1d–5d), calendar picker, owner avatars, clear button | Text link toggle; four unlabeled `TextInput`s with faint placeholders |
| Breach banner | Red card with warning icon + two-line copy | Text-only box, no icon |
| Buttons | Visible bordered/filled controls throughout | Many actions are text-only links with small touch targets |

## Out of scope

- New backend features or data model changes.
- Android build.
- Full Categories / Accounts CRUD parity (tracked separately).

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Category donut pie chart | [01-category-donut-pie-chart.md](./01-category-donut-pie-chart.md) | Done |
| 2 | Daily spending composed chart | [02-daily-spending-composed-chart.md](./02-daily-spending-composed-chart.md) | Done |
| 3 | Transaction filters UX parity | [03-transaction-filters-ux-parity.md](./03-transaction-filters-ux-parity.md) | Done |
| 4 | Dashboard card layout and tab styling | [04-dashboard-card-layout-and-tab-styling.md](./04-dashboard-card-layout-and-tab-styling.md) | Done |
| 5 | Shared form inputs and button components | [05-shared-form-inputs-and-buttons.md](./05-shared-form-inputs-and-buttons.md) | Done |
| 6 | Breach banner and visual polish | [06-breach-banner-and-visual-polish.md](./06-breach-banner-and-visual-polish.md) | Done |

## Suggested implementation order

1. **Foundation (5):** Reusable inputs and buttons — other tasks depend on consistent primitives.
2. **Charts (1–2):** Highest visual impact; replace placeholder implementations from task 15 in Aletheia-0001.
3. **Layout (4):** Wrap charts and transactions in card containers with proper tab styling.
4. **Filters (3):** Port full filter UX once form components exist.
5. **Polish (6):** Breach banner icon, spacing, dark-mode pass.

## Web reference files

- `web/src/components/SpendingPieChart.tsx`
- `web/src/components/DailySpendingChart.tsx`
- `web/src/components/TransactionFilters.tsx`
- `web/src/App.tsx` (dashboard layout, tabs, breach banner)
- `web/src/components/SummaryBar.tsx`

## iOS files to update

- `ios/src/components/SpendingCharts.tsx` — replace with real chart components
- `ios/src/components/TransactionTable.tsx` — extract filters, improve layout
- `ios/src/screens/DashboardScreen.tsx` — card layout, tab styling
- `ios/src/components/SummaryBar.tsx` — minor spacing tweaks if needed

## UX parity checklist

- [x] Category tab shows a donut pie chart (expenses only) with colored legend and percentages
- [x] Daily tab shows vertical bar chart with cumulative line, axes, grid, and formatted tooltips
- [x] Daily chart date labels show `DD/MM` (not truncated ISO prefix)
- [x] Chart section sits inside a bordered card with styled tab bar
- [x] Transaction view uses a segmented pill control for All / By Category
- [x] Filters use labeled sections, date presets, optional calendar, owner chips, and clear action
- [x] Filter toggle and primary actions use visible button styling with adequate touch targets
- [x] Breach banner includes warning icon matching web
- [ ] Light and dark mode verified on physical device
