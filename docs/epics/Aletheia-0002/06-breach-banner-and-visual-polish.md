# Task 06 — Breach banner and visual polish

**Epic:** [Aletheia-0002](./Aletheia-0002.md)  
**Status:** Not started  
**Depends on:** [04-dashboard-card-layout-and-tab-styling.md](./04-dashboard-card-layout-and-tab-styling.md), [05-shared-form-inputs-and-buttons.md](./05-shared-form-inputs-and-buttons.md)

## Description

Final polish pass on dashboard visuals after charts, layout, and form components land. The breach banner on iOS is text-only inside a red background box; web adds a warning triangle icon, border, and clearer typographic hierarchy. Summary cards on iOS are close to web but can benefit from consistent padding and tabular-nums alignment.

Also address minor issues visible in screenshots:

- Category list in old chart mode included income ("Receitas") at 77% — pie chart task should exclude non-expenses, but verify summary/list consistency
- Transaction row action modal: promote outline vs filled button distinction to match web modal patterns
- Ensure error banner styling matches web (bordered red card)

## Acceptance criteria

- [ ] Breach banner includes warning icon aligned with web SVG semantics (use `@expo/vector-icons` or similar).
- [ ] Breach banner has border + background matching `colors.dangerBg` / danger text hierarchy.
- [ ] Summary bar cards use consistent inner padding and numeric alignment.
- [ ] Error state box on dashboard matches bordered alert styling from web.
- [ ] Transaction action bottom sheet uses `Button` variants from task 05.
- [ ] Full dashboard reviewed on physical device in light and dark mode; no truncated labels outside chart scroll areas.
- [ ] Epic UX parity checklist in `Aletheia-0002.md` marked complete.

## Reference

- Web breach banner: `web/src/App.tsx` (~546–558)
- iOS: `ios/src/screens/DashboardScreen.tsx` breach block, `ios/src/components/SummaryBar.tsx`
