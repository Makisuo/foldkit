---
'foldkit': minor
'@foldkit/ui': minor
'@foldkit/devtools': patch
'create-foldkit-app': patch
'@foldkit/oxlint-plugin': patch
'@foldkit/vite-plugin': patch
---

Require checked completion before an assembled Block can be used.

`Composition.assembleBlock` now returns an opaque draft. Keep the assembly in a private zero-argument `assemble` producer and initialize the matching `Block.FromAssembly*<typeof Model, typeof assemble>` export with `Block.complete(assemble)`. This preserves the explicit Model boundary that keeps parent Schema inference responsive. Bindings, Programs, and server rendering reject unfinished drafts; Layer replacement and host-handler provision preserve completed Blocks.

Update UI factories, scaffolds, lint recognition, and current guidance to use this completion boundary. Completion remains passive and preserves the original Block's metadata and precise requirements.

Fix Program Flags validation for dynamic checked-Block unions so every possible root initializer must accept exactly the hosted Flags.
