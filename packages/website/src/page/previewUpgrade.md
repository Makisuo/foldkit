# Upgrade a Previous Preview

## Overview

This guide covers the direct upgrade from the previous Block preview to the candidate represented by this website deployment. It applies when the installed canary source suffix is `c701daa80af1`, `396b19976386`, or `bfd880b1e6ca`. Those snapshots have the same application API for this migration. The separate local rehearsal starts from Coverchart checkpoint `084f1c94f38137837e9609c63ef08176ad607c9a`, with `foldkit@0.168.0-canary.bfd880b1e6ca` and its installed Foldkit packages aligned to that snapshot. Local packed-artifact checks do not replace acceptance against the published target packages.

The candidate is not available merely because this page exists. An uploaded integration preview identifies itself in the page banner and in the same-origin [`preview-release.json`](/preview-release.json). Use the exact source commit and package versions from that manifest. Do not guess a version, npm tag, or package URL.

If the project uses a stable release or an earlier preview architecture, start with [Migrate to the Preview](/preview-migration). The current [Block](/core/block), [Runtime](/core/runtime), and [server rendering](/core/server-rendering) guides describe the target architecture in full.

## Select the Installed Source and Target

### Identify the installed preview

Read both `package.json` and the package manager lockfile. `package.json` records the requested Foldkit packages; the lockfile records the versions the project actually resolves. A canary version ends in `-canary.<source-hash>`.

Compare the source hash suffix across `foldkit`, `@foldkit/ui`, and every other Foldkit package the project declares. Their numeric version prefixes can differ because each package has its own version line. The source hash must agree. A project with different source hashes has a mixed snapshot and should be aligned before code migration.

### Install one coherent target

On an uploaded integration preview, the banner identifies the verified release and links to its exact package versions. The manifest's `packages` object is the authority for the exact version of every package in the snapshot. Update every Foldkit dependency the project declares to the corresponding exact version, update the lockfile with the project's package manager, and confirm that the resolved canary suffixes all name the manifest's `sourceCommit`.

Do not combine candidate packages with packages from the previous preview. Internal package dependencies are tested as one commit-addressed set.

If the project enforces pnpm's `minimumReleaseAge`, a newly uploaded preview may be too recent to install. Preserve that policy and add only the exact `name@version` entries from the verified manifest to `minimumReleaseAgeExclude`. Do not disable the age check globally.

## Update the Application Boundary

### Complete an ordinary root Block

The root now follows the same Definition to Composition to completed Block path as every feature. Replace `makeApplicationDefinition` with `Block.makeDefinition('Application', ...)`. Assemble the authored init, update, view, lifecycle declarations, and local `EffectsLayer` into `ApplicationBlock` with `ApplicationComposition.assembleBlock`.

The old `ApplicationComposition.assembleApplication` and `ApplicationComposition.assembleElement` methods have been removed. Browser host fields do not belong in `assembleBlock`.

::Snippet{name="counterApplicationWithFlags" label="Completing the root Block"}

### Create the browser Program

Create the browser host in `entry.ts`. Use `Program.make` for a page-owning application or `Program.makeElement` for an application scoped to its container. Pass `ApplicationBlock`, the container, Flags, routing, DevTools, and other browser host options there. Supply ordinary Services with `program.provide(ApplicationLayer)` before starting the Runtime.

::Snippet{name="applicationEntryPoint" label="Starting the browser Program"}

Replace `devTools: { Message: ApplicationBlock.Message }` with `devTools: { dispatch: true }` when an external MCP client should discover and dispatch Messages. Program derives the dispatch Codec from the completed root Block, including generated child envelopes. Omitting `devTools` keeps development inspection enabled with external dispatch disabled. `devTools: false` disables the DevTools store, overlay, and browser bridge.

Remove annotations and imports that use the old loose root types from `Runtime`:

- `ApplicationConfig` and `ApplicationConfigWithFlags`
- `RoutingApplicationConfig` and `RoutingApplicationConfigWithFlags`
- `ElementConfig` and `ElementConfigWithFlags`
- `ApplicationInit`, `RoutingApplicationInit`, and `ElementInit`
- `MakeRuntimeReturn`

Root behavior types now come from the completed Block and its Composition. Use `Program.Program`, `Program.Element`, or `Program.Runnable` when a public signature needs to describe a browser host value. Server rendering has separate host configuration types and keeps them.

Application Schema aliases remain legal, but current application code uses direct type queries. Inside a feature, annotate an uncommon explicit boundary with `typeof Model.Type`, `typeof Message.Type`, or `typeof OutMessage.Type`. Outside a child, query `typeof ChildBlock.Model.Type`, `typeof ChildBlock.Message.Type`, or `typeof ChildBlock.OutMessage.Type`. Let Definition and Composition callbacks infer their owned parameters. Keep purposeful public, generic, mapped, and conditional aliases such as an owner-specific `Block.ViewBuilderFor` type.

Canonical routing Messages can be passed directly when their payloads are `{ request }` and `{ url }`. Keep a callback when the application maps either value into a different payload.

### Pass the completed Block to the server

`Server.renderToString` now receives the same `ApplicationBlock` as the browser Program. Its second argument contains server host declarations such as `Flags` and `routing`. Its third argument contains request inputs such as `flags` and `url`. Remove `init`, `update`, `view`, lifecycle declarations, and handler recipes from the server call because the completed Block already carries them.

::Snippet{name="serverRenderingBlockServerEntry" label="Rendering the completed root Block"}

## Rename Step Composition

Replace `Update.combine` with `Update.combineSteps` in both data-first and data-last calls. The helper applies pure Steps sequentially to the Model and collects their Commands; it does not sequence Command execution. Its arguments, inferred requirements, and registration checks are unchanged. See [Combining Steps](/core/update#combining-steps).

## Update UI Call Sites

### Render Animation content through `toView`

Animation replaced its `content: Html` ViewInput with `toView: () => Html`. The renderer runs at the parent embedding boundary, so event handlers created inside it use the parent dispatcher.

::Snippet{name="previewUpgradeAnimationView" label="Rendering Animation content"}

### Select the completed Toast Block and Binding in tests

The module-level `Toast.test` fixture is gone. Call `test.drainEntry` on the exact completed Block returned by `Toast.make`, and pass the exact Binding registered for that Block. A keyed Binding also needs its occurrence key.

::Snippet{name="uiToastDrainEntry" label="Selecting the Toast fixture and Binding"}

The helper handles a freshly shown, non-sticky entry whose first enter and auto-dismiss lifecycle is pending. Use individual Command resolvers after another test step has advanced that lifecycle.

## Confirm the Remaining Compiler Findings

Search first, then change only the code the project contains:

- Replace remaining `makeApplicationDefinition`, `assembleApplication`, and `assembleElement` uses with the completed root Block and Program boundary above.
- Update each server render whose first argument is an Application Composition or whose host config repeats `init`, `update`, or `view`.
- Replace Animation `viewInputs.content` with a top-level `toView` renderer.
- Replace module-level `Toast.test` calls with the completed Toast Block's fixture and exact Binding.
- Move every child OutMessage policy out of the `bindChild` config and select it with `.withOutMessagePolicy({ fold?, forward? })`. Build every callable fold with `ParentDefinition.makeOutMessageFold(ChildBlock, handlers)`, including inline folds. The forwarding API is unchanged. For self-referential or reciprocal policy, name the ordinary Bindings first, author the helpers against those values, then select and register `<Child>BindingWithOutMessagePolicy`. No raw child matcher or return annotation is needed.
- Run typechecking against every `makeInit` plan and connected Binding Step. An ordinary Step must return an update result. Preserve a deferred connected operation through the owning Definition's `step`, and execute it only inside the Composition that registered its Binding. The stronger checks also retain Command requirements from combined initialization Steps.
- Keep callbacks at the top level of `viewInputs`. A callback nested in a record, array, tuple, union, or `Option` is rejected because its dispatch boundary is ambiguous. Return callback-bearing Html from a top-level renderer such as `toView` instead.

Run the project's formatter, typecheck, lint, tests, and build after these edits. Treat each reported site as evidence. Do not mechanically rewrite every Binding or OutMessage policy.

## Optional Convenience

One addition can shorten current code, but it is not required to complete this upgrade.

An exact required `Schema.Option` field containing one keyed Struct wrapper can use the `field`, `key`, and `childField` Binding shorthand. `None` means absent, and `Binding.init` remains responsible for creating an occurrence. Existing explicit `readAll`, `read`, `writeAt`, and `keySchema` policies remain supported. See [Optional keyed children](/core/block#fold-child-at) before choosing the shorthand.

## Refresh Agent Context

If the project already vendors Foldkit at `repos/foldkit`, pin it to the full `sourceCommit` from `preview-release.json`, not to `main` and not to a guessed release tag. Refresh any copied Foldkit skills from that subtree; existing symlinked skill directories follow the new subtree automatically. If the project maintains the managed `FOLDKIT.md` snapshot, replace it with `repos/foldkit/packages/create-foldkit-app/templates/base/FOLDKIT.md`.

A project without those assets can use this deployment's documentation and commit-pinned source links directly; adding vendored source or skills is optional. Preserve the project's `AGENTS.md` and any other project-owned instructions. `FOLDKIT.md` is the replaceable framework snapshot; `AGENTS.md` belongs to the project.

When asking a coding agent to perform the migration, give it this page URL and the same-origin `/preview-release.json` URL. That supplies both the migration path and the verified target manifest without relying on remembered API names.

## Troubleshooting

- **The Program rejects `ApplicationBlock`.** Make sure the root has no OutMessage for a host to discard. Author its view through the same Composition used by `assembleBlock`; `Program.make` requires a `Document` view and `Program.makeElement` requires an Html view.
- **Server init arguments do not match.** The presence of `Flags` and `routing` determines whether root init receives Flags, a URL, both, or neither. Keep request values in the third `renderToString` argument.
- **A connected Step has no readable `model` or `commands`.** Return or compose the opaque result inside the registered Composition. Do not execute a Binding operation against a raw parent Model outside that graph.
- **A ViewInput reports a nested callback.** Move the callback to a top-level ViewInput renderer. Keep the data it consumes in sibling fields or close over parent view values.
- **`ToastBlock.test.drainEntry` finds no timer.** Check the completed Toast Block, exact Binding, occurrence key, entry ID, and timer version. Use individual resolvers when the entry is sticky or its lifecycle has advanced.
- **Installed packages show different canary hashes.** Reapply the exact manifest versions and regenerate the lockfile before diagnosing TypeScript errors.
- **pnpm refuses a newly uploaded package because of its age.** Add that exact manifest entry to `minimumReleaseAgeExclude`. Keep the project's minimum release age enabled.
