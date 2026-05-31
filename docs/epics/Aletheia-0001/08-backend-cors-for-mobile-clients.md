# Task 08 — Backend CORS for mobile clients

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md)

## Description

Review API Gateway / Lambda CORS configuration. Native iOS apps typically do not send browser CORS preflight, but Expo web preview and any WebView flows may. Confirm auth and API calls work from the iOS dev client and document any infra changes needed in `infra/lib/stack.ts` or `backend/src/middleware/cors.ts`.

## Acceptance criteria

- [ ] iOS app can call all protected endpoints without CORS errors in dev.
- [ ] CORS origins list updated if Expo dev server origin must be allowed.
- [ ] `docs/ARCHITECTURE.md` notes mobile client access pattern.
