---
'foldkit': minor
---

Support data-last `provide(layer)` for composing an application or Element with `pipe`, alongside the existing data-first `provide(application, layer)` call. Both forms preserve unmet service requirements until the program is runnable.

Import `provide` from `foldkit/application`. For an entry point, use `Runtime.run(provide(application, ApplicationLayer))`; use `pipe` when provision is one step in a larger data flow.
