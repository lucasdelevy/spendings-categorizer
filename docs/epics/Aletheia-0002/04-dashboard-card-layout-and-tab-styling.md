# Task 04 — Dashboard card layout and tab styling

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Done  
**Depends on:** [01-category-donut-pie-chart.md](./01-category-donut-pie-chart.md), [02-daily-spending-composed-chart.md](./02-daily-spending-composed-chart.md)

## Description

Restructure the iOS dashboard layout to match the web app's card-based hierarchy. On web, the chart area sits inside a rounded bordered card with a tab bar separated by a bottom border; active tabs get an indigo underline. The transactions section has an uppercase section heading and a segmented pill control for All / By Category.

On iOS, charts render inline with minimal chrome, both tab bars are plain centered text with no underline or background, and there is no "Transactions" section header. The result feels like a wireframe compared to the polished web mobile view.

Update `DashboardScreen.tsx` to wrap the chart block in a surface card (`borderRadius`, border, padding) and introduce reusable tab components.

## Acceptance criteria

- [ ] Chart section wrapped in a card (`surface` background, border, rounded corners, inner padding).
- [ ] Chart tabs ("By Category" / "By Day") use active underline + primary color; inactive tabs muted — matching web tab bar inside the card header.
- [ ] Transactions section has a labeled header (`app.transactions`) above the table.
- [ ] All / By Category switch uses a segmented pill control (rounded container, filled active segment) instead of plain text tabs.
- [ ] Vertical spacing between summary bar, breach banner, chart card, and transactions matches web rhythm (~24px gaps).
- [ ] Layout works on small iPhones without horizontal overflow outside the chart scroll area.

## Reference

- Web: `web/src/App.tsx` (lines ~562–626 — chart card and transaction header)
- iOS: `ios/src/screens/DashboardScreen.tsx`
