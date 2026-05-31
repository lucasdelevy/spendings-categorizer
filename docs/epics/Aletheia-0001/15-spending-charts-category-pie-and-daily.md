# Task 15 — Spending charts (category pie + daily)

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [11-dashboard-month-selector-and-data-loading.md](./11-dashboard-month-selector-and-data-loading.md)

## Description

Port the chart tabs on the dashboard: category pie chart (expenses only) and daily spending bar/line chart. Use a React Native chart library (e.g. `react-native-gifted-charts`, `victory-native`, or Skia-based charts).

Reference: `web/src/components/SpendingPieChart.tsx`, `web/src/components/DailySpendingChart.tsx`, `web/src/components/TabBar.tsx`.

## Acceptance criteria

- [ ] Tab switcher: "By category" / "Daily".
- [ ] Pie chart shows category breakdown with colors from category config.
- [ ] Daily chart aggregates non-hidden transactions by date.
- [ ] Charts render correctly in light and dark mode.
- [ ] Touch-friendly on iPhone screen sizes.
