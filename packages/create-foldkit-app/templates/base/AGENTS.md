# Agent Development Notes

This is a Foldkit app. Read [`FOLDKIT.md`](./FOLDKIT.md) before writing any code in this project. It covers the architecture, the APIs, and the conventions the project is built on.

Root `application.ts` owns `Application` and `ApplicationComposition`. Import `defineApplication` from `foldkit`; create every root Composition with `Application.toComposition(...)`, even when it has no children or Mounts. Root application.ts keeps straightforward Bindings beside the complete toComposition children/Mount lists. Extract substantial policies to composition/<child>.ts and import them directly; no separate root composition wrapper. A split feature uses composition.ts, including for Mount-only registrations. Shared Mount definitions live in mount.ts. Parent-owned Bindings from Application.bindChild(...) are passive relationship configuration; including them in the Composition children registers them. `entry.ts` imports each implementation piece from its real owner, lists those fields explicitly in `ApplicationComposition.toApplication` or `ApplicationComposition.toElement`, chooses browser inputs, calls `application.provide(ApplicationLayer)` when needed, and starts the Runtime. Keep root `ApplicationLayer` composition in `services.ts`; `entry.ts` imports it and starts the completed application. A small app can keep its logic in `application.ts`; split substantial Model, Message, update, and view logic into named files. Tests and server entries import the passive Composition and the pieces they need without starting the browser Runtime. Name the root Route union `ApplicationRoute` and the root provider `ApplicationLayer` (`ApplicationTestLayer` for its test alternative).

Foldkit owns `FOLDKIT.md` and replaces it whole on upgrade. This file is yours. Anything you want an agent to know about this project goes below, where an upgrade won't touch it.

`FOLDKIT.md` reads the line below to decide whether it has already offered to vendor the Foldkit source. Leave it in place.

subtree_prompted: false

## Project Notes

Domain vocabulary, deployment steps, local conventions that differ from Foldkit's defaults: write them here.
