---
'foldkit': minor
---

Remove `Runtime.makeApplication` and `Runtime.makeElement`, including their `resources` configuration field. Establish the typed `Application` with `defineApplication` from `foldkit/application`. Complete it through its owned `make` or `makeElement` method, then supply application-lifetime Services with the standalone `provide` utility before calling `Runtime.run`, `Runtime.hydrate`, or `Runtime.embed`.

Owned completion captures Model, Message, and registered children. Pass local init, update, view, lifecycle declarations, and handler recipes to completion. Remaining Service requirements must be satisfied before the program can start.

Application Layers build eagerly once for each runtime start and release when that runtime stops. They are available to Flags, Commands, Subscriptions, Mounts, and ManagedResources. This differs from the removed `resources` field, which deferred construction until Flags, a Command, or a Subscription first requested its services. An application Layer build failure stops startup before the first render, where no Model exists for a crash view.

`Runtime.hydrate` validates the server build identity and Flags payload before acquiring application Layers. A refused handoff contains the served page before any application Layer can start work or fail to build.
