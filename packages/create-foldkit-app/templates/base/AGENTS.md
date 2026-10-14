# Agent Development Notes

This is a Foldkit app. Read [`FOLDKIT.md`](./FOLDKIT.md) before writing any code in this project. It covers the architecture, the APIs, and the conventions the project is built on.

Root `application.ts` owns the typed `ApplicationDefinition`. Import `define` as `defineApplication` from `foldkit/application`. Export the registered authoring value as `Application` when the root has child connections or Mounts; a graphless root completes `ApplicationDefinition` directly. `entry.ts` imports each implementation piece from its real owner, lists those fields explicitly in the owned `make` or `makeElement`, chooses the browser inputs, calls `application.provide(ApplicationLayer)` when needed, and starts the Runtime. Keep a small `ApplicationLayer` in `entry.ts`; extract `services.ts` when the provider composition is substantial or reused. A small app can keep its logic in `application.ts`; split substantial Model, Message, update, and view logic into named files. Tests and server entries import the passive definition and the pieces they need without starting the browser Runtime. Name the root Route union `ApplicationRoute` and the root provider `ApplicationLayer` (`ApplicationTestLayer` for its test alternative).

Foldkit owns `FOLDKIT.md` and replaces it whole on upgrade. This file is yours. Anything you want an agent to know about this project goes below, where an upgrade won't touch it.

`FOLDKIT.md` reads the line below to decide whether it has already offered to vendor the Foldkit source. Leave it in place.

subtree_prompted: false

## Project Notes

Domain vocabulary, deployment steps, local conventions that differ from Foldkit's defaults: write them here.
