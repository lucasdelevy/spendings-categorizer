# Task 01 — Move web app to `web/` folder

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** —

## Description

Move the existing Vite + React frontend from the repository root into a `web/` directory. Update all relative paths (`vite.config.ts` base URL, `tsconfig`, imports) so the app still builds and runs locally.

## Scope

Move these root-level frontend artifacts into `web/`:

- `src/`, `public/`, `index.html`
- `package.json`, `package-lock.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`
- `.env.example` (frontend env vars)

Keep at repo root: `backend/`, `infra/`, `docs/`, `mock-data/`, root `.gitignore`.

## Acceptance criteria

- [ ] `cd web && npm install && npm run dev` starts the app on port 5173.
- [ ] Production build succeeds: `cd web && npm run build`.
- [ ] GitHub Pages base path (`/spendings-categorizer/`) still works.
- [ ] No broken imports or path references in the moved files.
