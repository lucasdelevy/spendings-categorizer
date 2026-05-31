# Task 06 — API client and secure token storage

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md)

## Description

Port the web API client (`web/src/auth/api.ts`) to React Native. Store the JWT in secure storage (`expo-secure-store`) instead of `localStorage`. Implement the same request helpers (`get`, `post`, `put`, `delete`) with Bearer auth and error handling.

## Acceptance criteria

- [ ] API base URL configurable via env.
- [ ] JWT persisted across app restarts in SecureStore.
- [ ] 401 responses clear session and redirect to login.
- [ ] All endpoints used by the web app are callable from the shared client module.
