# Task 01 — Collapsible category cards and limit progress

**Epic:** [Aletheia-0003](./Aletheia-0003.md)  
**Status:** Not started  
**Depends on:** [Aletheia-0002 task 05](../Aletheia-0002/05-shared-form-inputs-and-buttons.md)

## Description

Replace the iOS `SectionList` category headers with collapsible cards matching the web accordion in `TransactionTable.tsx` (lines ~415–507).

Today, every category is always expanded and the header is plain text (`category name · total · count · 104%`). Web uses a full-width tappable card header with:

- Category color dot, name, `{count}x` pill badge
- Optional hidden-count badge (eye icon + number)
- Total amount aligned right (green income / red expense)
- Chevron that rotates when expanded
- Spending-limit progress bar below the title row (`limitProgress`, `limitColor`, `effectiveMonthlyLimit` from `@aletheia/shared`)

Collapsed categories should hide their transaction rows entirely (default: all collapsed, or match web default of collapsed until user expands — web starts with empty `expanded` Set, so all collapsed initially).

## Acceptance criteria

- [ ] `byCategory` mode renders one `Card` per filtered category (not `SectionList` sections).
- [ ] Tapping the header toggles expand/collapse; chevron animates or reflects state.
- [ ] Header shows `{count}x` badge and formatted total with semantic color.
- [ ] When category has hidden transactions, show hidden-count badge on header.
- [ ] When category has a configured limit, show progress bar and limit copy matching web (`limits.ofLimit`, `limits.exceeded`).
- [ ] Expanded state tracked in component state (`Set<string>`), same pattern as web.
- [ ] Hidden transactions remain in the list when expanded (dimmed in task 02); totals exclude hidden amounts like web.

## Reference

- Web: `web/src/components/TransactionTable.tsx` (`toggle`, category card JSX)
- iOS: `ios/src/components/TransactionTable.tsx`
