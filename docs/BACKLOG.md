# Backlog & Tech Debt

Living document of planned features and known tech debt. Update as items are completed or new ones are identified.

## Priority: High

- [ ] **Complete Google OAuth setup** — Create Google Cloud project, OAuth consent screen, and Client ID. Update Lambda env vars and frontend `.env` with the real Client ID.
- [ ] **Move JWT_SECRET to Secrets Manager** — Currently a placeholder env var on the Lambda. Should be rotated and stored in AWS Secrets Manager with CDK integration.
- [ ] **Add CI/CD for backend deploys** — GitHub Actions workflow that builds backend + runs `cdk deploy` on push to main (requires OIDC role for GitHub Actions → AWS).

## Priority: Medium

- [ ] **Multi-month trend charts** — Show spending trends over time by querying all saved statements for the user. Line chart by category over months.
- [ ] **Statement sharing between family members** — Allow multiple users to view the same family statement. Requires a shared-access model in DDB.
- [ ] **Offline-first with service worker** — Cache the app shell and last-loaded statements for offline viewing.
- [ ] **Better error handling on Lambda cold starts** — google-auth-library initialization is slow on first invocation. Consider provisioned concurrency or lazy init.
- [ ] **Statement detail view from Saved Statements** — Clicking a saved statement should load it into the categorization view (pie chart + table) without re-uploading the CSV.

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
