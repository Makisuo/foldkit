# Upgrade a Previous Preview

## Overview

This guide covers upgrades from the Block previews listed below to the candidate represented by this website deployment. Identify the installed snapshot before choosing its migration path.

| Installed canary source suffix                    | Upgrade path                                                                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1fbeaffe6563`                                    | [Upgrade from 1fbeaffe6563](#upgrade-from-1fbeaffe6563).                                                                                                                            |
| `c701daa80af1`, `396b19976386`, or `bfd880b1e6ca` | Follow the complete guide, including the application boundary, Step composition, and UI call-site changes. These three snapshots share the same application API for this migration. |

The older-preview baseline was checked at Coverchart checkpoint `084f1c94f38137837e9609c63ef08176ad607c9a`, with `foldkit@0.168.0-canary.bfd880b1e6ca` and its installed Foldkit packages aligned to that snapshot.

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

## Upgrade from 1fbeaffe6563

The verified source is `1fbeaffe656303b44d8fd20c18d598f08014a5c9`. Its root already completes through `assembleBlock` and uses `Program.make` or `Program.makeElement`. Keep its existing wiring:

- Child policies use `withOutMessagePolicy`.
- Animation content uses `toView`.
- Toast tests use the completed Block's helper.
- Step composition uses `Update.combineSteps`.

After installing one coherent target, make the changes used by your application:

1. Apply the [Definition and Namespace factory renames](#rename-definition-authoring-factories). The old names have no compatibility aliases.
2. Replace `Animation.defaultLeaveCommand` with the [bound leave-settlement operation](#replace-the-standard-animation-leave-helper) wherever the application uses standard CSS settlement. Keep custom settlement Commands for additional signals.
3. Run [the upgrade checks](#verify-the-upgrade). Assembly now rejects incompatible same-named Command handler contracts inside generic Block factories. Correct the owning definitions or handler Layers when this exposes invalid wiring.

The compiler-work reductions also apply without changing Block authoring. [Native TypeScript tooling](#native-typescript-tooling), [explicit assembly boundaries](#keep-source-model-schemas-independent-of-completion), and [Command-only Steps](#optional-convenience) are separate setup or organization choices.

## Update the Application Boundary

This section applies to `c701daa80af1`, `396b19976386`, and `bfd880b1e6ca`.

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

## Rename Definition Authoring Factories

Definition-owned factories now use the same `make*` naming as `makeInit`, `makeUpdate`, and `makeView`. Replace each removed name:

| Previous preview                   | Current API                            |
| ---------------------------------- | -------------------------------------- |
| `Definition.command(...)`          | `Definition.makeCommand(...)`          |
| `Definition.mount(...)`            | `Definition.makeMount(...)`            |
| `Definition.mountStream(...)`      | `Definition.makeMountStream(...)`      |
| `Definition.resource(...)`         | `Definition.makeResource(...)`         |
| `Definition.subscriptions(...)`    | `Definition.makeSubscriptions(...)`    |
| `Definition.managedResources(...)` | `Definition.makeManagedResources(...)` |
| `Definition.bindChild(...)`        | `Definition.makeBinding(...)`          |
| `Definition.step(...)`             | `Definition.makeStep(...)`             |
| `Definition.stepFields(...)`       | `Definition.makeFieldsStep(...)`       |
| `Definition.stepNoop()`            | `Definition.makeNoopStep()`            |

Apply the primitive factory renames to an early Namespace used by a generic Block factory as well. `Definition.makeCommandsStep(...)` already has its final name. Keep completion fields such as `subscriptions` and `managedResources`, completed Block metadata, and standalone Command and Update APIs unchanged. The removed factory names have no compatibility aliases.

## Rename Step Composition

This change applies to `c701daa80af1`, `396b19976386`, and `bfd880b1e6ca`.

Replace `Update.combine` with `Update.combineSteps` in both data-first and data-last calls. The helper applies pure Steps sequentially to the Model and collects their Commands; it does not sequence Command execution. Its arguments, inferred requirements, and registration checks are unchanged. See [Combining Steps](/core/update#combining-steps).

## Update UI Call Sites

### Render Animation content through `toView`

This change applies to `c701daa80af1`, `396b19976386`, and `bfd880b1e6ca`.

Animation replaced its `content: Html` ViewInput with `toView: () => Html`. The renderer runs at the parent embedding boundary, so event handlers created inside it use the parent dispatcher.

::Snippet{name="previewUpgradeAnimationView" label="Rendering Animation content"}

### Replace the standard Animation leave helper

`Animation.defaultLeaveCommand` has been removed. For standard CSS settlement, name the ordinary Animation Binding before its OutMessage fold and return `AnimationBinding.requestWaitForLeaveSettlement()` from `StartedLeaveAnimating`. Register the policy-selected alias with `AnimationBinding.withOutMessagePolicy({ fold })`. Delete the child Model read and `FoldContext.liftCommand` call that only supported the old helper.

Keep a custom leave Command when settlement also watches another signal, such as trigger movement. Take its generation from `StartedLeaveAnimating`. A custom Command that returns `EndedAnimation` still uses the fold context's `liftCommand`; a parent-owned result Message can call `AnimationBinding.requestFinish(generation)`. See [Animation lifecycle coordination](/ui/animation#why) for both policies.

### Select the completed Toast Block and Binding in tests

This change applies to `c701daa80af1`, `396b19976386`, and `bfd880b1e6ca`.

The module-level `Toast.test` fixture is gone. Call `test.drainEntry` on the exact completed Block returned by `Toast.make`, and pass the exact Binding registered for that Block. A keyed Binding also needs its occurrence key.

::Snippet{name="uiToastDrainEntry" label="Selecting the Toast fixture and Binding"}

The helper handles a freshly shown, non-sticky entry whose first enter and auto-dismiss lifecycle is pending. Use individual Command resolvers after another test step has advanced that lifecycle.

## Native TypeScript Tooling

The target scaffold pins its `typescript` development dependency to native TypeScript `7.1.0-beta`. Existing applications using native TypeScript can adopt the same exact version to use the compiler version checked for this preview. This tooling update is separate from the required factory and Animation API changes.

After installation, confirm that the project's typecheck command and editor language server resolve the intended installed compiler. Restart the language server after changing its package or SDK path. A different global compiler or editor server can produce different performance and diagnostics. Preserve any separate compatibility compiler used by other tools.

The preview reduces repeated compiler work during Block assembly. Large root assemblies can still produce noticeable editor delays; the update does not guarantee a particular response time or memory limit in every editor. Keep the project's normal typecheck and test coverage when changing compiler versions.

### Optional editor setup: tsrs

[tsrs](https://github.com/oxc-project/tsrs/blob/467182f2402b140897e8a02d7a25699db0e79e2a/docs/LSP.md) is an experimental TypeScript language server. In a real Neovim trial, it made `ApplicationBlock` completion usable, though not instantaneous. Testing is limited to that trial and the paired benchmarks recorded in [#1737](https://github.com/foldkit/foldkit/issues/1737); those benchmarks predate the latest optimization and do not establish current-candidate performance.

This is optional editor setup. Keep the project's official TypeScript dependency, typecheck scripts and CI unchanged.

#### Install and select the server

Install the tested version outside the application, then check the executable's identity:

::Snippet{name="previewTsrsInstall" label="Install the pinned editor server"}

The npm package version identifies the tsrs release; its `--version` output also identifies the TypeScript version it implements, so record both.

For Neovim 0.11 or later, use the installed executable in your LSP configuration. Replace the example path with its absolute installation path. Keep exactly one TypeScript server enabled for the trial buffers by disabling the previous server there.

::Snippet{name="previewTsrsNeovim" label="Select tsrs in Neovim"}

Restart Neovim and open a TypeScript file in the intended project. Run `:checkhealth vim.lsp` and confirm that `foldkit_tsrs_trial` is attached, with the intended executable and project root. Try completion, hover and a diagnostic that appears and clears after an edit. These checks confirm the selected editor server; the project's official typecheck remains the verification gate.

To revert, remove the trial configuration, restore the previous server's enablement and restart Neovim. Confirm the previous client is attached before removing the isolated installation.

See the [official editor setup](https://github.com/oxc-project/tsrs/blob/467182f2402b140897e8a02d7a25699db0e79e2a/docs/LSP.md) for other editors and current limitations.

## Keep Source Model Schemas Independent of Completion

Give an ordinary completed Block an explicit producer/header boundary. Move its existing `assembleBlock` call into a zero-argument `assembleSettingsBlock` function, then export `SettingsBlock` with the matching `Block.FromAssemblyWith*` annotation and initialize it by calling that producer once. Keep its payload, local effects and graph unchanged.

::Snippet{name="blockFeatureExports" label="An explicit completed Block boundary"}

Choose the helper from the Definition's declared OutMessage and the assembled view:

| Assembled view | Declared OutMessage | Export annotation                           |
| -------------- | ------------------- | ------------------------------------------- |
| Yes            | No                  | `Block.FromAssemblyWithView`                |
| Yes            | Yes                 | `Block.FromAssemblyWithViewAndOutMessage`   |
| No             | Yes                 | `Block.FromAssemblyWithOutMessage`          |
| No             | No                  | `Block.FromAssemblyWithoutViewOrOutMessage` |

Each helper takes `typeof Model` and `typeof assembleSettingsBlock`. The four names keep the view and OutMessage shapes explicit; there is no unified `FromAssembly` helper. The longer annotation gives TypeScript a direct Model member without making a parent infer the whole source implementation merely to read its Schema. The producer still infers the assembled implementation, and the helper checks its exact completed contract and Model Schema. Do not replace this with a cast, a broad Block annotation, or `satisfies`.

The feature barrel exports its completed Block. Keep the Model Schema internal to the feature and compose parent state with `SettingsBlock.Model`. An application that adopted a separate canonical Model reexport for compiler performance can remove that reexport after adding the checked header and updating its parent imports. Preserve independently public domain Schemas and generic component contracts.

The recommended `foldkit/no-completed-block-model-in-schema` rule still reports proven inferred completed Models inside Schema construction, including nested wrappers. It accepts the recognized checked producer/header boundary. Ordinary public Model access and type queries remain supported. See [Model Schema dependencies](/patterns/project-organization#keep-model-schema-dependencies-small) for recognition limits. This is a compiler-work boundary, not a promise of instant editor responses.

## Confirm the Remaining Compiler Findings

The checklist below applies to the older `c701daa80af1`, `396b19976386`, and `bfd880b1e6ca` snapshots. For `1fbeaffe6563`, use [its direct upgrade path](#upgrade-from-1fbeaffe6563), then [verify the upgrade](#verify-the-upgrade). Search first, then change only the code the project contains:

- Replace every removed Definition or Namespace factory name using the table above. Do not rename completion config fields, completed Block metadata, or standalone Command and Update APIs.
- Replace remaining `makeApplicationDefinition`, `assembleApplication`, and `assembleElement` uses with the completed root Block and Program boundary above.
- Update each server render whose first argument is an Application Composition or whose host config repeats `init`, `update`, or `view`.
- Replace Animation `viewInputs.content` with a top-level `toView` renderer.
- Replace `Animation.defaultLeaveCommand` and its Model read or `liftCommand` wiring with the bound `requestWaitForLeaveSettlement()` operation. Preserve custom leave Commands that also watch movement or another completion signal.
- Replace module-level `Toast.test` calls with the completed Toast Block's fixture and exact Binding.
- Move every child OutMessage policy out of the previous preview's `bindChild` config, rename that factory to `makeBinding`, and select the policy with `.withOutMessagePolicy({ fold?, forward? })`. Build every callable fold with `ParentDefinition.makeOutMessageFold(ChildBlock, handlers)`, including inline folds. The forwarding API is unchanged. For self-referential or reciprocal policy, name the ordinary Bindings first, author the helpers against those values, then select and register `<Child>BindingWithOutMessagePolicy`. No raw child matcher or return annotation is needed.
- Run typechecking against every `makeInit` plan and connected Binding Step. An ordinary Step must return an update result. Preserve a deferred connected operation through the owning Definition's `makeStep`, and execute it only inside the Composition that registered its Binding. The stronger checks also retain Command requirements from combined initialization Steps.
- Keep callbacks at the top level of `viewInputs`. A callback nested in a record, array, tuple, union, or `Option` is rejected because its dispatch boundary is ambiguous. Return callback-bearing Html from a top-level renderer such as `toView` instead.

## Verify the Upgrade

Run the project's formatter, typecheck, lint, tests, and build after these edits. Treat each reported site as evidence. Do not mechanically rewrite every Binding or OutMessage policy. Include test files in typechecking and exercise the browser, SSR/SSG, or embedding path the application uses. Confirm that the lockfile resolves one exact Foldkit snapshot.

## Optional Convenience

Use `Definition.makeCommandsStep(commands)` for a composed Step whose only job is returning an existing Command collection. It preserves the Model and keeps Command requirements and Binding evidence. Keep `Definition.makeStep` when the Commands depend on the current Model or the transition also changes fields or emits an OutMessage. Ordinary update branches can keep returning their result objects directly.

These conveniences can shorten current code; they are optional when upgrading.

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
