# Backlog & Tech Debt

Living document of planned features and known tech debt. Update as items are completed or new ones are identified.

## Priority: High

- [x] **Complete Google OAuth setup** — Done. Google Cloud project created, Client ID configured in Lambda env vars and frontend `.env`/GitHub secrets.
- [x] **Soft-delete statements** — Done. Statements are marked `status: "overridden"` instead of hard-deleted.
- [x] **Family sharing** — Done. Multiple users can share spendings via a Family entity. Per-user uploads merged at read time with avatar attribution.
- [ ] **Move JWT_SECRET to Secrets Manager** — Currently a placeholder env var on the Lambda. Should be rotated and stored in AWS Secrets Manager with CDK integration.
- [ ] **Add CI/CD for backend deploys** — GitHub Actions workflow that builds backend + runs `cdk deploy` on push to main (requires OIDC role for GitHub Actions → AWS).

## Priority: Medium

- [ ] **Category management** — Move categories and their keyword lists from hardcoded `src/engine/categories.ts` to DynamoDB (per-family or per-user). Add a "Categorias" management page where the user can create/edit/delete categories and assign keywords (place names) to each. Also allow the user to click on any transaction in the table and re-categorize it (which updates the keyword mapping for future imports). DDB schema: `PK=FAMILY#<familyId>`, `SK=CAT#<categoryName>`, attributes: `keywords[]`, `color`. On first login or if no custom categories exist, seed from the current hardcoded defaults.
- [ ] **Multi-month trend charts** — Show spending trends over time by querying all saved statements for the family. Line chart by category over months.
- [ ] **Migrate solo statements to family** — When a user creates or joins a family, offer a one-time migration of their existing `USER#<userId>/STMT#*` records into the new `FAMILY#<familyId>` namespace.
- [ ] **Family ownership transfer** — Allow the current owner to transfer ownership to another active member.
- [ ] **Leave family flow** — Allow a non-owner member to leave a family voluntarily.
- [ ] **Offline-first with service worker** — Cache the app shell and last-loaded statements for offline viewing.
- [ ] **Better error handling on Lambda cold starts** — google-auth-library initialization is slow on first invocation. Consider provisioned concurrency or lazy init.
- [x] **Statement detail view from Saved Statements** — Done. Month-based UX loads saved data directly from DDB into pie chart + table. "Visualizar" button in Gerenciar Meses page.
- [ ] **Re-upload from Gerenciar Meses** — Add a "Reenviar" button per month in the management page that navigates back to the main view with the uploader open for that month, allowing the user to re-upload CSVs and overwrite saved data.

## Priority: Low

- [ ] **Code splitting** — Vite build warns about chunk size (563 KB). Split recharts into a lazy-loaded chunk.
- [ ] **Custom domain for API** — Set up a custom domain on API Gateway (e.g., `api.spendings.lucasdelevy.dev`) with ACM certificate.
- [ ] **Rate limiting** — Add throttling on API Gateway to prevent abuse (free tier is generous but not unlimited).
- [ ] **Add support for other banks** — Currently Nubank-specific CSV formats. Add parsers for Itaú, Bradesco, Inter, etc.
- [ ] **Export categorized data** — Download categorized statements as CSV or PDF report.
- [ ] **Dark mode** — Respect `prefers-color-scheme` and add a toggle in the header.
- [ ] **i18n** — Support English UI in addition to Portuguese.

## Tech Debt

- [ ] Lambda handler code uses a single handler per function that routes internally. Consider migrating to per-route handlers if the number of endpoints grows.
- [ ] The esbuild config excludes `@aws-sdk/*` from the bundle (relying on Lambda runtime). Pin to a specific SDK version in prod to avoid drift.
- [ ] Frontend `dist/` is committed to git (legacy from initial setup). Remove from tracking and rely solely on GitHub Actions to build.
- [ ] No automated tests yet — add at minimum: unit tests for categorization engine, integration tests for Lambda handlers with DDB Local.
- [ ] Family members list uses `listMembers()` which does a full Query for every authorization check. Consider caching or inlining the role in the JWT.
