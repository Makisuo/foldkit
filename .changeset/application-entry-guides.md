---
'@foldkit/devtools': patch
'@foldkit/devtools-mcp': patch
---

Show the `Application`, `ApplicationComposition`, its owned `toApplication` method, and the completed application's `provide` method in DevTools setup guidance and installer instructions. Root graph assembly through `Application` and `ApplicationComposition` lives in `application.ts`; explicit runtime-input completion and browser startup remain in `entry.ts`.
