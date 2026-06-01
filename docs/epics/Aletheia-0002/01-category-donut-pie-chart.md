# Task 01 — Category donut pie chart

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Not started  
**Depends on:** Aletheia-0001 task 15 (functional baseline)

## Description

Replace the iOS "By Category" placeholder — a flat list of dots, labels, percentages, and amounts — with a real donut pie chart matching the web app.

The current `SpendingCharts.tsx` category mode renders rows only; there is no circular visualization. The web app uses Recharts (`SpendingPieChart.tsx`) with an inner-radius donut, category colors from config, expense-only filtering, and a legend with one-decimal percentages.

Pick a React Native chart library suited to Expo (e.g. `react-native-gifted-charts`, `victory-native`, or Skia-based charts). Split category and daily modes into separate components if it keeps the code clearer.

## Acceptance criteria

- [ ] "By Category" tab renders a donut/pie chart centered in the chart card area.
- [ ] Only expense categories (`total < 0`) are included, matching web `showExpensesOnly` behavior.
- [ ] Segment colors come from `getCategoryColor` / category config.
- [ ] Legend below or beside the chart shows category name and percentage (one decimal place).
- [ ] Tooltip or press feedback shows formatted BRL amount for a segment.
- [ ] Empty state handled gracefully when no expense categories exist.
- [ ] Renders correctly in light and dark mode on iPhone screen sizes.

## Reference

- Web: `web/src/components/SpendingPieChart.tsx`
- iOS (replace): `ios/src/components/SpendingCharts.tsx` category branch
