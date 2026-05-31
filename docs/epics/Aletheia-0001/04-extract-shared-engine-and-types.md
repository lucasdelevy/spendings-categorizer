# Task 04 — Extract shared engine and types package

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [01-move-web-app-to-web-folder.md](./01-move-web-app-to-web-folder.md), [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md)

## Description

Extract the client-side categorization engine and shared TypeScript types so both `web/` and `ios/` consume the same logic. Candidates for sharing:

- `engine/csvParser.ts`, `bankCategorizer.ts`, `cardCategorizer.ts`, `familyCategorizer.ts`, `categories.ts`, `refunds.ts`
- `types.ts` (Transaction, CategoryConfig, Account, etc.)
- `utils/dates.ts`, `utils/limits.ts`

## Options

1. **`packages/shared/`** workspace package (npm workspaces or pnpm).
2. **Symlink / copy** — avoid if possible; drift risk.

Prefer option 1.

## Acceptance criteria

- [ ] Shared package builds and exports types + engine functions.
- [ ] `web/` imports from shared package; existing web behavior unchanged.
- [ ] `ios/` imports from shared package for CSV processing.
- [ ] Unit tests for engine logic run against the shared package (move or duplicate `dedupService`-level tests as needed).
