# Backlog & Tech Debt — Spendings Categorizer (Aletheia)

Living document of planned features and known tech debt. Update as items are completed or new ones are identified.

## Priority: High

- [x] **Complete Google OAuth setup** — Done. Google Cloud project created, Client ID configured in Lambda env vars and frontend `.env`/GitHub secrets.
- [x] **Soft-delete statements** — Done. Statements are marked `status: "overridden"` instead of hard-deleted.
- [x] **Family sharing** — Done. Multiple users can share spendings via a Family entity. Per-user uploads merged at read time with avatar attribution.
- [ ] **Move JWT_SECRET to Secrets Manager** — Currently a placeholder env var on the Lambda. Should be rotated and stored in AWS Secrets Manager with CDK integration.
- [x] **Add CI/CD for backend deploys** — Done. `deploy-backend.yml` workflow triggers on `backend/**`/`infra/**` changes, uses OIDC + CDK deploy. Frontend workflow now has path filters.

## Priority: Medium

- [x] **Category management** — Done. Categories, ignore lists, and rename maps stored in DDB per-family/user (`CATCONFIG`). "Categorias" page with Bank/Card tabs, keyword chips, color picker, ignore/rename management. Transaction re-categorization via tag-icon picker in the table. New `categories` Lambda.
- [x] **Category spending limits** — Done. Per-category daily/weekly/monthly limits with progress bars (green/amber/red) on category headers, "Limits Exceeded" count in summary bar, and breach alert banner on dashboard.
- [ ] **Limit breach e-mail notifications** *(depends on: Category spending limits)* — Send an e-mail alert to the user (and optionally family members) when a category spending limit is breached. Use SES for delivery; include category name, limit, current total, and a deep link to the dashboard.
- [ ] **All-transactions view** — Add a new default tab in the "Transactions" listing that shows all transactions in a flat list without category grouping. Keeps the existing categorized view as a secondary tab.
- [ ] **Multi-month trend charts** — Show spending trends over time by querying all saved statements for the family. Line chart by category over months.
- [ ] **Migrate solo statements to family** — When a user creates or joins a family, offer a one-time migration of their existing `USER#<userId>/STMT#*` records into the new `FAMILY#<familyId>` namespace.
- [ ] **Family ownership transfer** — Allow the current owner to transfer ownership to another active member.
- [ ] **Leave family flow** — Allow a non-owner member to leave a family voluntarily.
- [ ] **Offline-first with service worker** — Cache the app shell and last-loaded statements for offline viewing.
- [ ] **Better error handling on Lambda cold starts** — google-auth-library initialization is slow on first invocation. Consider provisioned concurrency or lazy init.
- [x] **Statement detail view from Saved Statements** — Done. Month-based UX loads saved data directly from DDB into pie chart + table. "Visualizar" button in Gerenciar Meses page.
- [ ] **Re-upload from Gerenciar Meses** — Add a "Reenviar" button per month in the management page that navigates back to the main view with the uploader open for that month, allowing the user to re-upload CSVs and overwrite saved data.
- [x] **Transaction table filters** — Done. Collapsible filter bar on the transaction table with amount range, date range, and owner multi-select. Filters combine and recompute category totals/counts in real time.

## Priority: Low

- [ ] **Code splitting** — Vite build warns about chunk size (563 KB). Split recharts into a lazy-loaded chunk.
- [ ] **Custom domain for API** — Set up a custom domain on API Gateway (e.g., `api.spendings.lucasdelevy.dev`) with ACM certificate.
- [x] **Rate limiting** — Done. Stage-level default throttling (50 req/s, burst 100) on API Gateway with stricter per-route limits on auth endpoints (5 req/s for login/logout, 10 req/s for session check).
- [ ] **Add support for other banks** — Currently Nubank-specific CSV formats. Add parsers for Itaú, Bradesco, Inter, etc.
- [ ] **Export categorized data** — Download categorized statements as CSV or PDF report.
- [x] **Dark mode** — Done. Class-based Tailwind dark mode with ThemeContext (localStorage-persisted, respects `prefers-color-scheme` as default). Sun/moon toggle in header. All pages and components styled.
- [x] **i18n** — Done. react-i18next with EN and PT-BR translations across all pages/components. Language switcher in header and login page.

## Tech Debt

- [ ] Lambda handler code uses a single handler per function that routes internally. Consider migrating to per-route handlers if the number of endpoints grows.
- [ ] The esbuild config excludes `@aws-sdk/*` from the bundle (relying on Lambda runtime). Pin to a specific SDK version in prod to avoid drift.
- [ ] Frontend `dist/` is committed to git (legacy from initial setup). Remove from tracking and rely solely on GitHub Actions to build.
- [ ] No automated tests yet — add at minimum: unit tests for categorization engine, integration tests for Lambda handlers with DDB Local.
- [ ] Family members list uses `listMembers()` which does a full Query for every authorization check. Consider caching or inlining the role in the JWT.
