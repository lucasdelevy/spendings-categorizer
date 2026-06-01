# Task 02 — Daily spending composed chart

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Done  
**Depends on:** [01-category-donut-pie-chart.md](./01-category-donut-pie-chart.md)

## Description

Replace the iOS "By Day" placeholder — horizontal progress bars with broken date labels — with a composed bar + line chart matching the web `DailySpendingChart`.

**Known bug:** iOS uses `date.slice(0, 5)` for labels, which renders `2026-` instead of the day. Web formats dates as `DD/MM` on the X axis and shows full date in tooltips.

**Known gap:** iOS shows only horizontal bars for the last 14 days with no axes, grid, cumulative line, or tooltips. Web uses Recharts `ComposedChart` with daily bars (indigo), cumulative spending line (amber), dual Y axes (`k` formatting), dashed grid, and rotated X labels.

## Acceptance criteria

- [ ] "By Day" tab renders a vertical bar chart of daily expense totals (non-hidden, negative amounts only).
- [ ] Orange cumulative line overlays bars on a secondary Y axis, matching web semantics.
- [ ] X axis labels use `DD/MM` format; tooltips show full `DD/MM/YYYY`.
- [ ] Y axes use compact formatting (`900`, `1.8k`, etc.) for large values.
- [ ] Horizontal dashed grid lines visible; chart scrolls horizontally when many days are present.
- [ ] Date parsing handles both `YYYY-MM-DD` and `DD/MM/YYYY` inputs (port `normaliseDate` logic from web).
- [ ] No truncated `2026-` labels.
- [ ] Renders correctly in light and dark mode.

## Reference

- Web: `web/src/components/DailySpendingChart.tsx`
- iOS (replace): `ios/src/components/SpendingCharts.tsx` daily branch
