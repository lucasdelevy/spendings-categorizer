# Task 11 — Dashboard — month selector and remote data loading

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [06-api-client-and-secure-token-storage.md](./06-api-client-and-secure-token-storage.md), [07-google-sign-in-on-ios.md](./07-google-sign-in-on-ios.md)

## Description

Build the main dashboard screen: month picker, loading saved months from `GET /statements`, and fetching merged family data via `GET /statements/{yearMonth}%23family` after `POST /categories/apply`. Port logic from `web/src/App.tsx` (`loadSavedMonths`, `loadMonthFromRemote`, `remoteToResult`, month cache).

Reference: `web/src/components/MonthSelector.tsx`.

## Acceptance criteria

- [ ] Month selector lists saved months plus current month when empty.
- [ ] Selecting a month loads remote statement and shows loading state.
- [ ] In-memory month cache avoids redundant API calls.
- [ ] Empty month shows upload prompt (handled in task 12).
- [ ] Error states displayed when fetch fails.
