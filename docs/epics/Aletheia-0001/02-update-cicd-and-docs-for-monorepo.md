# Task 02 — Update CI/CD and docs for monorepo layout

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [01-move-web-app-to-web-folder.md](./01-move-web-app-to-web-folder.md)

## Description

Update GitHub Actions workflows, `AGENTS.md`, `docs/ARCHITECTURE.md`, and `README.md` to reflect the new `web/` path. Ensure deploy workflows only trigger on `web/**` changes (not `ios/**`).

## Acceptance criteria

- [ ] `.github/workflows/deploy.yml` builds from `web/` and deploys to GitHub Pages.
- [ ] Path filters exclude unrelated folders (`ios/`, `backend/`, etc.) where appropriate.
- [ ] `AGENTS.md` project structure shows `web/` instead of root `src/`.
- [ ] `README.md` local dev instructions point to `cd web && npm run dev`.
