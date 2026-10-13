# Agent Development Notes

This is a Foldkit app. Read [`FOLDKIT.md`](./FOLDKIT.md) before writing any code in this project. It covers the architecture, the APIs, and the conventions the project is built on.

Root `application.ts` owns the typed `Application` definition and its implementation. Import `define` as `defineApplication` from `foldkit/application`. Complete the root through `Application.make` or a registered composition's owned `make`; `entry.ts` chooses the browser container and startup inputs, calls `application.provide(ApplicationLayer)`, and starts the Runtime. Shared ordinary service providers live in `services.ts`. A small app can keep its logic in `application.ts`; split substantial Model, Message, update, and view logic into named files. Create the completed `application` in `entry.ts` with owned `Application.make({ init, update, view, container, ... })`. Tests and server entries import the passive definition and implementation pieces without starting the browser Runtime. Name the root Route union `ApplicationRoute` and the root provider `ApplicationLayer` (`ApplicationTestLayer` for its test alternative).

Foldkit owns `FOLDKIT.md` and replaces it whole on upgrade. This file is yours. Anything you want an agent to know about this project goes below, where an upgrade won't touch it.

`FOLDKIT.md` reads the line below to decide whether it has already offered to vendor the Foldkit source. Leave it in place.

subtree_prompted: false

## Project Notes

Domain vocabulary, deployment steps, local conventions that differ from Foldkit's defaults: write them here.
