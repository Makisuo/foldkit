# Agent Development Notes

This is a Foldkit app. Read [`FOLDKIT.md`](./FOLDKIT.md) before writing any code in this project. It covers the architecture, the APIs, and the conventions the project is built on.

Root `application.ts` owns `ApplicationDefinition` and `ApplicationComposition`. Import `define` as `defineApplication` from `foldkit/application`; create every root Composition with `ApplicationDefinition.toComposition(...)`, even when it has no children or Mounts. Parent-owned child Bindings come from `ApplicationDefinition.bindChild(...)` and are listed in the Composition's `children`. `entry.ts` imports each implementation piece from its real owner, lists those fields explicitly in `ApplicationComposition.make` or `makeElement`, chooses browser inputs, calls `application.provide(ApplicationLayer)` when needed, and starts the Runtime. Keep a small `ApplicationLayer` in `entry.ts`; extract a root `layer.ts` only when provider composition is substantial or reused. A small app can keep its logic in `application.ts`; split substantial Model, Message, update, and view logic into named files. Tests and server entries import the passive Composition and the pieces they need without starting the browser Runtime. Name the root Route union `ApplicationRoute` and the root provider `ApplicationLayer` (`ApplicationTestLayer` for its test alternative).

Foldkit owns `FOLDKIT.md` and replaces it whole on upgrade. This file is yours. Anything you want an agent to know about this project goes below, where an upgrade won't touch it.

`FOLDKIT.md` reads the line below to decide whether it has already offered to vendor the Foldkit source. Leave it in place.

subtree_prompted: false

## Project Notes

Domain vocabulary, deployment steps, local conventions that differ from Foldkit's defaults: write them here.
