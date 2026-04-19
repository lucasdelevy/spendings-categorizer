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
└────────────────────┬─────────────────────────────────────────────┘
                     │ HTTPS (Bearer JWT)
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  API Gateway HTTP API (us-east-1)                                │
│  https://9kb7anm4rl.execute-api.us-east-1.amazonaws.com         │
│                                                                  │
│  CORS: lucasdelevy.github.io, localhost:5173                    │
└────────┬──────────────────────────────────┬──────────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────────┐
│  Auth Lambda         │          │  Statements Lambda       │
│  POST /auth/google   │          │  GET /statements         │
│  GET /auth/me        │          │  POST /statements        │
│  POST /auth/logout   │          │  GET /statements/{id}    │
└─────────┬───────────┘          │  DELETE /statements/{id} │
          │                       └────────────┬────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  DynamoDB Table: spendings-categorizer                           │
│  Billing: PAY_PER_REQUEST                                        │
│  TTL: expiresAt (session auto-cleanup)                          │
└──────────────────────────────────────────────────────────────────┘
```

## DynamoDB Single-Table Schema

| Record    | PK                | SK                        | Key Attributes                              |
|-----------|-------------------|---------------------------|---------------------------------------------|
| User      | `USER#<googleId>` | `PROFILE`                 | email, name, picture, googleId, createdAt   |
| Session   | `USER#<googleId>` | `SESS#<sessionId>`        | expiresAt (TTL, epoch seconds), createdAt   |
| Statement | `USER#<googleId>` | `STMT#<YYYYMM>#<type>`   | fileName, uploadedAt, summary, transactions |

- `userId` = Google's `sub` claim (googleId), used directly.
- `sessionId` = ULID generated at login time.
- Statement SK example: `STMT#202603#bank` — natural key, one per month/type, upsert-friendly.
- No GSI required. JWT contains `{ userId, sessionId }` for direct lookups.

## Authentication Flow

1. Frontend loads Google Identity Services script.
2. User clicks Google Sign-In button → receives a Google ID token.
3. Frontend POSTs `{ idToken }` to `/auth/google`.
4. Auth Lambda verifies token with `google-auth-library`, upserts user in DDB, creates session.
5. Returns a JWT (HS256, 7-day expiry) containing `{ userId, sessionId }`.
6. Frontend stores JWT in localStorage, sends as `Authorization: Bearer <jwt>` on subsequent requests.
7. Protected endpoints decode JWT, check session exists and is not expired in DDB.
8. Logout: deletes session from DDB, frontend clears localStorage.

## API Endpoints

| Method | Path               | Auth | Description                        |
|--------|--------------------|----- |------------------------------------|
| POST   | `/auth/google`     | none | Exchange Google ID token for JWT   |
| GET    | `/auth/me`         | JWT  | Get current user profile           |
| POST   | `/auth/logout`     | JWT  | Invalidate session                 |
| GET    | `/statements`      | JWT  | List user's saved statements       |
| POST   | `/statements`      | JWT  | Save a processed statement         |
| GET    | `/statements/{id}` | JWT  | Get statement details (id=YYYYMM#type) |
| DELETE | `/statements/{id}` | JWT  | Delete a statement                 |

## Project Structure

```
spendings-categorizer/
├── src/                    # Frontend (React + Vite)
│   ├── auth/               # AuthContext, GoogleSignIn, api client
│   ├── components/         # UI components
│   ├── engine/             # CSV parsing + categorization logic
│   ├── pages/              # LoginPage, SavedStatements
│   └── types.ts
├── backend/                # Lambda handlers
│   ├── src/
│   │   ├── handlers/       # auth.ts, statements.ts
│   │   ├── middleware/     # JWT auth, CORS
│   │   └── services/       # DDB operations
│   ├── esbuild.config.mjs
│   └── package.json
├── infra/                  # AWS CDK
│   ├── bin/app.ts
│   ├── lib/stack.ts
│   └── package.json
├── docs/                   # This documentation
└── .github/workflows/      # GitHub Pages deploy
```

## Deployment

- **Frontend**: Push to `main` → GitHub Actions builds and deploys to GitHub Pages.
- **Backend**: `cd backend && npm run build` then `cd ../infra && npx cdk deploy`.
- **AWS Account**: 905418115093, region us-east-1.
- CDK bootstrap already done. Stack name: `SpendingsCategorizerStack`.
