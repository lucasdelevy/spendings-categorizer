# Task 13 — Save statement flow

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [12-csv-upload-and-local-preview.md](./12-csv-upload-and-local-preview.md)

## Description

Port the save confirmation bar and `POST /statements` flow. After local CSV processing, user confirms save; app posts processed transactions with account assignments and category config applied. Handle card `closingDay` rebucketing (month cache clear on save).

Reference: `web/src/components/SaveConfirmBar.tsx`.

## Acceptance criteria

- [ ] Confirm bar shows summary before save (totals, file count).
- [ ] Save posts to backend and switches data source to remote.
- [ ] Month selector updates to saved month.
- [ ] Account assignment respected when accounts exist.
- [ ] Save errors surfaced to user.
