# Task 14 — Summary bar and spending limits

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [11-dashboard-month-selector-and-data-loading.md](./11-dashboard-month-selector-and-data-loading.md)

## Description

Port `SummaryBar` and the limits breach banner. Show total in, total out, balance, visible/hidden transaction counts, and "limits exceeded" count. Display red alert banner listing breached categories when any category exceeds its configured daily/weekly/monthly limit.

Reference: `web/src/components/SummaryBar.tsx`, `web/src/utils/limits.ts`, dashboard breach logic in `App.tsx`.

## Acceptance criteria

- [ ] Summary bar matches web metrics for the selected month.
- [ ] Limits exceeded count computed from category config + totals.
- [ ] Breach banner lists category names when limits are exceeded.
- [ ] Hidden transactions excluded from visible counts.
