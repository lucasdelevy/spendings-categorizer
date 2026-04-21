# App History — Spendings Categorizer (Aletheia)

## Phase 1: Python Scripts (stateless, CLI)

The project started as two standalone Python scripts for personal use:

- `categorizar.py` — processed Nubank bank statement CSVs (Portuguese headers, Brazilian decimal separators), categorized transactions by keyword matching, and produced a categorized CSV with subtotals.
- `categorizar_cartao.py` — same concept but for Nubank credit card statements (English headers, installment parsing).

Key decisions:
- Rule-based categorization using keyword matching in transaction descriptions.
- Brazilian Portuguese category names (user-facing).
- Ignored internal transfers (RDB applications/redemptions) to avoid skewing totals.
- Added a rename map to normalize merchant names (e.g., "HAYASHI COMERCIO..." → "Frutaria Vargem Bonita").

## Phase 2: React Static App on GitHub Pages (stateless, client-side)

Migrated to a React + TypeScript + Vite web app for easier access (no Python install required). All processing happens client-side in the browser.

Stack: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Papa Parse.

Structure:
- `src/engine/` — categorization logic ported from Python (bankCategorizer, cardCategorizer, familyCategorizer, csvParser, categories)
- `src/components/` — UI components (TabBar, CSVUploader, FamilyUploader, SpendingPieChart, TransactionTable, SummaryBar)
- Three tabs: "Gasto Familiar" (primary, multi-file), "Extrato Banco", "Cartão Crédito"

Key decisions:
- All code identifiers in English; user-facing strings in Portuguese.
- "Gasto Familiar" tab merges bank + card statements, deduplicates credit card bill payments from bank outflows, and tracks transaction source.
- Categories split: "Transporte" was divided into "Carro" and "Gasolina" for better granularity.
- Deployed to GitHub Pages via GitHub Actions (build on push to main).
- GitHub repo: `lucasdelevy/spendings-categorizer`

## Phase 3: Stateful App with Auth + DynamoDB (current)

Added a backend to persist categorized statements across sessions and support multi-user access.

Stack additions: AWS CDK, Lambda (Node.js 20), API Gateway HTTP API, DynamoDB, Google Sign-In, jose (JWT).

Architecture:
- Frontend remains on GitHub Pages (no change to deploy flow).
- Backend: two Lambda functions (auth, statements) behind an HTTP API Gateway.
- DynamoDB single-table design with composite PK/SK (see ARCHITECTURE.md).
- Google Sign-In for authentication; JWT sessions (7-day TTL).

Key decisions:
- Used googleId directly as userId (no mapping table) for simplicity.
- Statement natural key is `YYYYMM#type` — one statement per month per type, upsert-friendly.
- No GSI needed; JWT carries both userId and sessionId for direct lookups.
- CDK for infrastructure-as-code, deployed to AWS account 905418115093 (us-east-1).
- CORS restricted to GitHub Pages origin + localhost for dev.

## Phase 3.1: Soft-Delete + Month Management

Added soft-delete semantics: statements are marked `status: "overridden"` instead of being physically removed from DDB. This preserves history and supports re-upload workflows.

Also added:
- "Gerenciar Meses" management page (list, view, soft-delete per month).
- Month auto-detection from uploaded CSV dates.
- `SaveConfirmBar` component for month confirmation before saving.

## Phase 4: Family Sharing (current)

Introduced a Family abstraction so multiple users can share and view combined spendings.

Key changes:
- New DDB record types: `FAMILY#<familyId>/META`, `FAMILY#<familyId>/MEMBER#<userId>`, `EMAILFAM#<email>/LINK`.
- Family lifecycle: create → add members by email → auto-link on Google login.
- Statements scope: users in a family store uploads under `FAMILY#<familyId>` instead of `USER#<userId>`. Each user's upload is separate (`STMT#<YYYYMM>#<userId>`), merged at read time.
- Solo mode preserved: users without a family continue to work as before (backward compatible).
- Each transaction carries `uploadedBy: { userId, name, picture }` for avatar attribution in the UI.
- New "Família" management page for creating families and adding/removing members.
- New Lambda function (`families`) with dedicated API Gateway routes.

## Phase 5: Category Management

Moved category rules from hardcoded frontend constants to DynamoDB, enabling per-family (or per-user) customization.

Key changes:
- New DDB record `CATCONFIG` (PK = `FAMILY#<familyId>` or `USER#<userId>`, SK = `CATCONFIG`) stores all category rules: bank/card categories with keywords and colors, ignore lists, and rename maps.
- On first access, config is seeded from the hardcoded defaults so existing behavior is preserved.
- New "Categorias" management page with Bank/Card tabs, allowing users to create/edit/delete categories, manage keywords (as chips), set colors, manage ignore patterns, and manage payee rename mappings.
- Categorization engine refactored: `processBankCSV` and `processCardCSV` accept an optional config parameter. When the user's config is loaded from the API, it overrides the hardcoded defaults.
- Transaction re-categorization: each transaction row in the table has a tag icon button that opens a category picker. Selecting a new category updates the stored statement in DDB and adds the original description as a keyword to the chosen category for future imports.
- New Lambda function (`categories`) with `GET /categories`, `PUT /categories`, and `POST /categories/recategorize` routes.
- Added GitHub Actions CD workflow for backend: `deploy-backend.yml` triggers on `backend/**` or `infra/**` changes, uses OIDC to assume an IAM role, and runs `cdk deploy`.
- Frontend deploy workflow updated with path filters so it only triggers on frontend changes.

## Phase 6: Transaction Filters

Added a collapsible filter bar to the transaction table for more granular analysis.

Key changes:
- New `TransactionFilters` component with amount range (min/max), date range, and owner multi-select.
- Filters are combinable and recompute category totals/counts in real time.
- Filter panel toggles via a button in the table header, collapses to save space when not in use.

## Phase 7: Dark Mode & i18n

Added dark mode support and internationalization across the entire app.

Dark mode:
- Tailwind CSS class-based dark mode (`darkMode: "class"`) with a `ThemeContext` provider.
- Persists preference in `localStorage`, defaults to system preference via `prefers-color-scheme`.
- Sun/moon toggle; all pages and components styled with `dark:` utility classes.

i18n:
- `react-i18next` with full EN and PT-BR translation files covering all pages and components.
- Language switcher with flag emojis (Brazilian flag for PT-BR, US flag for EN-US).
- Browser language auto-detection via `i18next-browser-languagedetector`.

## Phase 8: Sidebar Navigation & Rebrand to Aletheia

Redesigned navigation and established the app's visual identity.

Navigation:
- Replaced the crowded header button row with a hamburger-triggered side menu that slides in from the left.
- Side menu sections: preferences (language switcher + dark mode toggle with label), page navigation (Categories, Family, Manage Months with icons), and user profile (avatar, name, email, logout) pinned to the bottom.
- Sidebar and header are consistent across all pages (dashboard, categories, family, manage months). Sub-pages removed their standalone wrappers and render inside the shared layout.

Rebrand:
- App renamed from "Spendings Categorizer" to **Aletheia** (ἀλήθεια — Greek for "unconcealment").
- Tagline: "Reveal what was concealed" (EN) / "Revele o que estava oculto" (PT-BR), displayed in italic with faded color.
- Mirrored Greek script "Ἀλήθεια" rendered as a ghosted reflection next to the title at 10% opacity.
- Custom favicon: indigo rounded square with a white serif Α (Greek capital alpha).
- Subtle dot-grid background pattern using indigo at ~4.5% opacity (light) / ~7% (dark), fixed position.
- Repository and package name remain `spendings-categorizer`; docs reference "Spendings Categorizer (Aletheia)".

## Phase 9: Hide/Unhide Transactions

Added a per-transaction hide toggle that grays out individual transactions and excludes them from all financial calculations.

Key changes:
- New `hidden?: boolean` field on `TransactionItem` (backend) and `Transaction` (frontend) types.
- Eye-slash button on each transaction row toggles visibility. Hidden rows render at 40% opacity with strikethrough on payee and amount.
- Hidden transactions are excluded from category subtotals, summary bar totals (income, expenses, balance), pie chart, and daily spending chart.
- New `POST /categories/hide` backend endpoint toggles the `hidden` flag and recalculates the stored summary.
- Backend `GET /statements/{id}` skips hidden transactions when computing totals but still returns them in the response for rendering.
- Category accordion headers show a hidden-count badge (eye-slash icon + number) when any transactions in that category are hidden.
- Summary bar gains a conditional "Hidden" card showing the total hidden count, which appears only when at least one transaction is hidden.
- CDK stack updated with new API Gateway route; also fixed `routeSettings` casing (`ThrottlingBurstLimit`/`ThrottlingRateLimit`) to satisfy updated CloudFormation validation.

## Phase 10: Month Navigator Redesign

Replaced the native `<select>` dropdown for month selection with a centered, gesture-driven month navigator.

Key changes:
- Large centered month title (full name, e.g. "April 2026") with left/right chevron arrows for sequential navigation.
- Dot timeline indicator below the title: one dot per available month, active month shown as an elongated indigo pill, other months as small gray circles that are directly clickable.
- Touch swipe support for mobile: horizontal swipe on the month area navigates to adjacent months (50px threshold).
- macOS trackpad integration: two-finger horizontal swipe fires month navigation via accumulated `wheel` `deltaX`, with 80px threshold and 400ms cooldown to prevent multi-fire.
- Keyboard arrow keys: `←`/`→` navigate months from anywhere on the dashboard (skipped when focus is inside form inputs).
- In-memory month cache (`Map<string, StatementResult>` in a `useRef`): previously loaded months are served instantly from cache on navigation, avoiding redundant API calls. Cache is invalidated per-month on mutations (save, recategorize, rename, ignore, hide, delete) and cleared entirely when category config changes.
- `formatYearMonth` updated from `month: "short"` to `month: "long"` for full month names across all locales.

## Phase 11: Pierre Open Finance Integration

Integrated Pierre Finance API for automatic transaction syncing via Open Finance, running alongside existing CSV uploads.

Key changes:
- New Lambda function (`spendings-categorizer-pierre`) with two trigger modes: EventBridge scheduled rule (every 5 minutes) for automatic sync, and `POST /pierre/sync` API Gateway route for manual sync.
- New `pierreService` handles Pierre API communication: fetches transactions, triggers manual bank sync, and maps Pierre's data model to `TransactionItem`.
- New `dedupService` provides shared cross-source deduplication used by both Pierre sync and CSV upload. Uses (date, amount) grouping with word-level Jaccard description similarity (threshold 0.3) to match transactions regardless of origin.
- Pierre sync runs two-pass dedup: Pass 1 uses `externalId` for Pierre-vs-Pierre exact matching, Pass 2 uses fingerprint matching for Pierre-vs-CSV overlap detection.
- CSV upload (`POST /statements`) now also deduplicates incoming transactions against existing data before saving, preventing double-counting when Pierre has already synced the same transactions.
- New `origin` field (`"csv" | "openfinance"`) on `TransactionItem` and `Transaction` types distinguishes transaction sources. New `externalId` field stores Pierre's transaction UUID for reliable re-sync dedup.
- Subtle origin indicator ("API" / "CSV") added to each transaction row in the UI, positioned near the hide button with low-opacity styling.
- Owner guard on the manual sync endpoint: only the user whose Google `sub` matches `PIERRE_USER_ID` env var can trigger manual syncs. EventBridge path is internal-only.
- Each sync covers current month + previous month to catch late-posting transactions near month boundaries, with a 1-day startDate buffer to work around Pierre's date filtering behavior.
