# Task 05 — App shell, navigation, and side menu

**Epic:** [Aletheia-0001](./Aletheia-0001.md)  
**Status:** Done  
**Depends on:** [03-initialize-expo-ios-project.md](./03-initialize-expo-ios-project.md)

## Description

Implement the root app layout equivalent to the web app's hamburger menu + page routing. Use React Navigation (drawer or stack + modal menu) to reach:

- Dashboard (home)
- Categories
- Accounts
- Family
- Manage Months
- About

Include user profile section (avatar, name, email) and logout button in the menu, matching `web/src/components/SideMenu.tsx`.

## Acceptance criteria

- [ ] All six destinations reachable from the side menu.
- [ ] Menu shows authenticated user info when logged in.
- [ ] Back navigation works on sub-pages.
- [ ] Unauthenticated users see only the login screen (no menu).
