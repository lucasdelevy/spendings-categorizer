# Task 12 — CSV upload and local preview

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [04-extract-shared-engine-and-types.md](./04-extract-shared-engine-and-types.md), [11-dashboard-month-selector-and-data-loading.md](./11-dashboard-month-selector-and-data-loading.md)

## Description

Implement file picking and local CSV processing on iOS. Use `expo-document-picker` (or equivalent) to select bank/card CSV files. Port `FamilyUploader` behavior: auto-detect statement type, support multiple files, run `buildFamilyResult` pipeline, show local preview before save.

Reference: `web/src/components/FamilyUploader.tsx`, `web/src/components/CSVUploader.tsx`.

## Acceptance criteria

- [ ] User can pick one or more CSV files from device storage.
- [ ] Bank and card files detected and merged with dedup (family categorizer).
- [ ] Local preview renders dashboard components before save.
- [ ] "Add statements" overlay when month already has remote data (family users).
- [ ] Parse errors shown with user-friendly message.
