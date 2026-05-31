# Task 07 — Google Sign-In on iOS

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [06-api-client-and-secure-token-storage.md](./06-api-client-and-secure-token-storage.md)

## Description

Implement Google OAuth on iOS, exchanging a Google ID token for the app JWT via `POST /auth/google`. Register an iOS OAuth client in Google Cloud Console and configure the Expo app (`ios.bundleIdentifier`, URL scheme).

Reference web implementation: `web/src/auth/AuthContext.tsx`, `web/src/auth/GoogleSignIn.tsx`, `web/src/pages/LoginPage.tsx`.

## Acceptance criteria

- [ ] Login screen with Google Sign-In button.
- [ ] Successful login stores JWT and loads user profile via `GET /auth/me`.
- [ ] Logout calls `POST /auth/logout` and clears SecureStore.
- [ ] Session restored on cold start when token is valid.
- [ ] iOS OAuth client ID documented in `ios/.env.example`.
