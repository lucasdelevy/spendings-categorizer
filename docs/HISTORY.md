# App History

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
