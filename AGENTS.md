# Agents Guide — Spendings Categorizer (Aletheia)

## Project Structure

```
├── src/                  # React frontend (Vite + Tailwind)
├── backend/              # AWS Lambda handlers (TypeScript + esbuild)
│   ├── src/handlers/     # Lambda entry points (auth, statements, categories, families)
│   └── src/services/     # Business logic (categoryService, statementService, etc.)
├── infra/                # AWS CDK infrastructure (API Gateway, Lambda, DynamoDB)
├── public/               # Static assets (favicon, etc.)
└── mock-data/            # Sample CSV files for local testing
```

## Deploying Backend Changes

The backend runs on AWS Lambda (Node.js 20.x, us-east-1). There are four Lambda functions:

| Function Name                        | Handler File       | Routes                        |
|--------------------------------------|--------------------|-------------------------------|
| `spendings-categorizer-auth`         | `auth.handler`     | `/auth/*`                     |
| `spendings-categorizer-statements`   | `statements.handler` | `/statements`, `/statements/{id}` |
| `spendings-categorizer-categories`   | `categories.handler` | `/categories`, `/categories/*` |
| `spendings-categorizer-families`     | `families.handler` | `/families`, `/families/*`    |
| `spendings-categorizer-accounts`     | `accounts.handler` | `/accounts`, `/accounts/{id}` |
| `spendings-categorizer-pierre`      | `pierre.handler`   | `/pierre/sync` + EventBridge (5 min) |

### Code-only deploy (no infra changes)

When changing only backend TypeScript code (handlers, services, types), deploy directly to Lambda without CDK:

```bash
# 1. Build
cd backend && npm run build

# 2. Package — include the handler .mjs and .mjs.map files the function needs
cd dist/handlers
zip -j /tmp/<function-name>.zip <relevant-files>

# 3. Deploy
aws lambda update-function-code \
  --function-name <function-name> \
  --zip-file fileb:///tmp/<function-name>.zip \
  --region us-east-1
```

Each Lambda bundles only the handler files it needs (see `exclude` patterns in `infra/lib/stack.ts`):

- **auth**: `auth.mjs`, `auth.mjs.map`
- **statements**: `statements.mjs`, `statements.mjs.map`
- **categories**: `categories.mjs`, `categories.mjs.map`, `statements.mjs`, `statements.mjs.map`
- **families**: `families.mjs`, `families.mjs.map`
- **accounts**: `accounts.mjs`, `accounts.mjs.map`
- **pierre**: `pierre.mjs`, `pierre.mjs.map`, `statements.mjs`, `statements.mjs.map`

### Infrastructure deploy (new routes, env vars, resources)

When changing infrastructure (new Lambda functions, API routes, DynamoDB config, env vars):

```bash
cd backend && npm run build
cd ../infra && npm run deploy
```

CDK stack name: `SpendingsCategorizerStack`.

## Deploying Frontend Changes

The frontend is a Vite React app hosted on GitHub Pages.

- **Local dev**: `npm run dev` (runs on port 5173 at `/spendings-categorizer/`)
- **Production deploy**: push to `main` — GitHub Actions builds and deploys to GitHub Pages automatically

## Key Backend Concepts

- **DynamoDB single-table design**: all data in `spendings-categorizer` table, keyed by `PK` (e.g., `USER#<id>` or `FAMILY#<id>`) and `SK`
- **Category config** (`SK: "CATCONFIG"`): holds keyword-to-category mappings, ignore patterns, and rename rules
- **Statements** (`SK: "<yearMonth>#<type>"`): hold parsed transactions with their current category assignment
- **`applyCategoryConfig`**: re-runs keyword matching on all transactions for a month; uses longest-keyword-wins strategy

## Feature Log Convention

Every major feature must be documented in four files:

1. **`docs/HISTORY.md`** — Append a new `## Phase N: Title` section describing the feature, key decisions, and technical changes.
2. **`src/pages/AboutPage.tsx`** — Add a corresponding entry to the `featureLog` array (with `phase`, `title`, and `description` i18n keys following the `about.features.phaseNTitle` / `about.features.phaseNDesc` pattern).
3. **`src/i18n/en.ts`** — Add the English title and description under `about.features.phaseNTitle` / `about.features.phaseNDesc`.
4. **`src/i18n/pt-BR.ts`** — Add the Portuguese title and description under the same keys.
