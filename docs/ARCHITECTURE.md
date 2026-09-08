# Architecture

## System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (GitHub Pages)                                         │
│  lucasdelevy.github.io/spendings-categorizer                    │
│                                                                  │
│  React 18 + TypeScript + Vite + Tailwind                        │
│  - Client-side CSV parsing + categorization                      │
│  - Google Sign-In (ID token)                                    │
│  - JWT stored in localStorage                                   │
├──────────────────────────────────────────────────────────────────┤
│  iOS App (Expo React Native) — see ios/                         │
│  - Same API; JWT in expo-secure-store                           │
│  - Sign in with Apple + Google; native fetch (no CORS)          │
└────────────────────┬─────────────────────────────────────────────┘
                     │ HTTPS (Bearer JWT)
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  API Gateway HTTP API (us-east-1)                                │
│  https://9kb7anm4rl.execute-api.us-east-1.amazonaws.com         │
│                                                                  │
│  CORS: lucasdelevy.github.io, localhost:5173                    │
└───────┬───────────────────────┬──────────────────┬───────────────┘
        │                       │                  │
        ▼                       ▼                  ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Auth Lambda    │  │ Statements Lambda │  │ Families Lambda   │  │ Categories Lambda │
│  /auth/google   │  │ /statements       │  │ /families         │  │ /categories       │
│  /auth/me       │  │ /statements/{id}  │  │ /families/mine    │  │ /categories/      │
│  /auth/logout   │  │                   │  │ /families/members │  │   recategorize    │
└───────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
        │                     │                      │                     │
        ▼                     ▼                      ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  DynamoDB Table: spendings-categorizer                           │
│  Billing: PAY_PER_REQUEST                                        │
│  TTL: expiresAt (session auto-cleanup)                          │
└──────────────────────────────────────────────────────────────────┘
```

## DynamoDB Single-Table Schema

| Record        | PK                    | SK                        | Key Attributes                                          |
|---------------|-----------------------|---------------------------|---------------------------------------------------------|
| User          | `USER#<googleId>`     | `PROFILE`                 | email, name, picture, googleId, familyId?, createdAt    |
| Session       | `USER#<googleId>`     | `SESS#<sessionId>`        | expiresAt (TTL, epoch seconds), createdAt               |
| Statement (solo) | `USER#<googleId>`  | `STMT#<YYYYMM>#<type>`   | fileName, uploadedAt, status, summary, transactions     |
| Statement (family) | `FAMILY#<familyId>` | `STMT#<YYYYMM>#<userId>` | fileName, uploadedAt, status, summary, transactions     |
| Family meta   | `FAMILY#<familyId>`   | `META`                    | name, createdBy, createdAt                              |
| Family member | `FAMILY#<familyId>`   | `MEMBER#<userId>`         | email, name, picture, role, status, joinedAt            |
| Category config | `FAMILY#<familyId>` or `USER#<userId>` | `CATCONFIG` | categories, ignore, rename, limitAlertPercent?, updatedAt |
| Account       | `FAMILY#<familyId>` or `USER#<userId>` | `ACCT#<accountId>` | name, type (bank/card), closingDay?, dueDay?, apiKeyEncrypted?, apiKeyHint?, apiKeyStatus?, createdBy, createdAt, updatedAt |
| Device        | `USER#<userId>`       | `DEVICE#<token>`          | token, platform (`ios`), locale, updatedAt                  |
| Limit alert   | `FAMILY#<familyId>` or `USER#<userId>` | `LIMITALERT#<YYYYMM>#<category>` | percent, threshold, notifiedAt |
| Email lookup  | `EMAILFAM#<email>`    | `LINK`                    | familyId                                                |
| User lookup   | `EMAILUSER#<email>`   | `LINK`                    | userId (links Google and Apple for the same email)      |

- `userId` is the first OAuth `sub` we see for that person (Google or Apple). A later sign-in with the other provider and the same email reuses that `userId`.
- `sessionId` = ULID generated at login time.
- `familyId` = ULID generated when creating a family.
- Statement `status`: `"active"` or `"overridden"` (soft-delete).
- Each transaction in a family statement includes `uploadedBy: { userId, name, picture }`.
- No GSI required. JWT contains `{ userId, sessionId }` for direct lookups.
- `EMAILFAM#<email>` auto-links pending family invites on login.
- `EMAILUSER#<email>` merges Google and Apple identities that share an email. Apple Hide My Email will not match a Gmail invite.

### Dual-mode statement scoping

The statement service checks `user.familyId`:
- **Has family**: PK = `FAMILY#<familyId>`, SK = `STMT#<YYYYMM>#<userId>` (per-user uploads under family)
- **No family (solo)**: PK = `USER#<userId>`, SK = `STMT#<YYYYMM>#<type>` (original behavior)

When reading a month in family mode, all `STMT#<YYYYMM>#*` records are fetched and merged into a combined view.

## Authentication Flow

1. Web loads Google Identity Services. iOS can use Sign in with Apple or Google.
2. The client sends a Google ID token to `POST /auth/google` or an Apple identity token to `POST /auth/apple`.
3. Auth Lambda verifies the token, resolves `userId` (existing profile, `EMAILUSER#<email>`, or new `sub`), upserts the user, and creates a session.
4. Returns a JWT (HS256, 7-day expiry) containing `{ userId, sessionId }`.
5. Clients store the JWT (localStorage or SecureStore) and send `Authorization: Bearer <jwt>` on subsequent requests.
6. Protected endpoints decode JWT, check session exists and is not expired in DDB.
7. Logout: deletes session from DDB, client clears the token.
8. Delete account: `DELETE /auth/me` removes the user's data and family membership (or dissolves a sole-owner family), then the client clears the token.

## API Endpoints

| Method | Path                       | Auth | Description                                |
|--------|----------------------------|----- |--------------------------------------------|
| POST   | `/auth/google`             | none | Exchange Google ID token for JWT           |
| POST   | `/auth/apple`              | none | Exchange Apple identity token for JWT (iOS) |
| GET    | `/auth/me`                 | JWT  | Get current user profile (incl. familyId, familyRole) |
| DELETE | `/auth/me`                 | JWT  | Permanently delete the signed-in account   |
| POST   | `/auth/logout`             | JWT  | Invalidate session                         |
| GET    | `/statements`              | JWT  | List statements (family or solo scoped)    |
| POST   | `/statements`              | JWT  | Save a processed statement                 |
| GET    | `/statements/{id}`         | JWT  | Get statement (merged if family mode)      |
| DELETE | `/statements/{id}`         | JWT  | Soft-delete a statement                    |
| POST   | `/families`                | JWT  | Create a family                            |
| GET    | `/families/mine`           | JWT  | Get user's family + members                |
| PUT    | `/families`                | JWT  | Update family name (owner/admin)           |
| DELETE | `/families`                | JWT  | Delete family (owner only)                 |
| POST   | `/families/members`        | JWT  | Add member by email (owner/admin)          |
| PUT    | `/families/members/{email}`| JWT  | Promote member to admin (owner/admin)      |
| DELETE | `/families/members/{email}`| JWT  | Remove member (owner/admin)                |
| GET    | `/categories`              | JWT  | Get category config (seeds defaults if missing) |
| PUT    | `/categories`              | JWT  | Replace full category config               |
| POST   | `/categories/recategorize` | JWT  | Re-categorize a transaction + update keyword rules |
| GET    | `/accounts`                | JWT  | List bank accounts and cards (sanitized — no plaintext keys) |
| POST   | `/accounts`                | JWT  | Create a new bank account or card           |
| PUT    | `/accounts/{id}`           | JWT  | Update name / closing day / API key         |
| DELETE | `/accounts/{id}`           | JWT  | Delete an account or card (transactions are preserved) |
| POST   | `/statements/{id}/assign-account` | JWT  | Re-tag every transaction in a saved statement to an account; rebuckets across months when the card closing day moves transactions into a different bill window |

## Project Structure

```
spendings-categorizer/
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── auth/           # AuthContext, GoogleSignIn, api client
│   │   ├── components/     # UI components (TransactionTable, FamilyUploader, etc.)
│   │   ├── engine/         # CSV parsing + categorization logic
│   │   ├── pages/          # LoginPage, SavedStatements, FamilyPage
│   │   └── types.ts
│   └── public/             # Static assets
├── ios/                    # Expo React Native app (planned)
├── backend/                # Lambda handlers
│   ├── src/
│   │   ├── handlers/       # auth.ts, statements.ts, families.ts, categories.ts
│   │   ├── defaults/       # categories.ts (seed data for category config)
│   │   ├── middleware/     # JWT auth, CORS
│   │   └── services/       # DDB operations (userService, statementService, familyService, categoryService)
│   ├── esbuild.config.mjs
│   └── package.json
├── infra/                  # AWS CDK
│   ├── bin/app.ts
│   ├── lib/stack.ts
│   └── package.json
├── docs/                   # This documentation
└── .github/workflows/      # GitHub Pages deploy
```

## Account API Key Encryption

Open Finance API keys attached to an account are encrypted before being persisted to DynamoDB:

- Algorithm: AES-256-GCM (authenticated encryption).
- Key source: `ACCOUNT_KEY_SECRET` Lambda env var. Treated as raw base64-encoded 32 bytes when possible; otherwise SHA-256-derived from the provided string.
- Storage format: `v1:<base64-iv>:<base64-tag>:<base64-ciphertext>` in the `apiKeyEncrypted` attribute.
- Side-channel hint: a `apiKeyHint` field stores `••<last4>` so the UI can show the user which key is configured without exposing it.
- Expiry flag: Pierre sync sets `apiKeyStatus: "expired"` when Pierre returns `expired_api_key` or `invalid_api_key`. The accounts API exposes this as `apiKeyExpired: true`. Saving a new key (or a successful sync) clears the flag.
- Decryption: only the Pierre sync Lambda imports `decryptApiKey`. The accounts handler never returns the ciphertext or plaintext — it returns a sanitized `{ hasApiKey, apiKeyHint, apiKeyExpired }` projection via `toPublicAccount`.
- Rotation: rotate by setting a new `ACCOUNT_KEY_SECRET` and re-saving each account's API key (frontend re-submits the value), since the legacy ciphertext will no longer authenticate.

## Card Statement Bucketing (vencimento)

Each credit card account stores a `closingDay` (default 30). When transactions are saved or synced from Pierre:

1. The handler computes a `billingMonth` per transaction. Transactions with `day <= closingDay` belong to the current month; later ones roll into the next month.
2. The save handler groups transactions by computed `billingMonth` and writes them under the corresponding `STMT#<YYYYMM>#…` record, so reads stay efficient (no cross-month scan in the common case).
3. `GET /statements/{id}` additionally pulls the previous and next month for users who have any card account with a closing day, then merges in only the transactions whose recomputed `billingMonth` matches the requested month — handling legacy data that didn't have `billingMonth` stored at write time.

## Deployment

- **Frontend**: Push to `main` → GitHub Actions builds and deploys to GitHub Pages.
- **Backend**: `cd backend && npm run build` then `cd ../infra && npx cdk deploy`.
- **AWS Account**: 905418115093, region us-east-1.
- CDK bootstrap already done. Stack name: `SpendingsCategorizerStack`.
