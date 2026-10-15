# Project Organization

## Overview

Keep each feature's behavior together and give its registered children and Mounts one visible assembly point. A split feature uses `composition.ts`; the application root uses `application.ts`. Both files put straightforward child Bindings beside the `toComposition` call that registers them.

`bindChild` configures a relationship: Model access, Message mapping, OutMessage handling, and lifecycle policy. It returns passive configuration. Including that Binding in `toComposition({ children })` registers the child. Neither operation constructs Layers or starts effects; the Runtime does that later.

## Starting Simple

The smallest application keeps Model, Message, init, update, view, and its typed Application definition in `application.ts`. A separate `entry.ts` chooses the browser container and startup inputs, supplies shared services, and starts the Runtime. Tests and server tooling can import the application pieces without starting a browser Runtime.

Add `story.test.ts` and `scene.test.ts` beside the behavior they test. The [Counter example](/example-apps/counter) shows a compact root.

A small feature with no children or Mounts can stay in `counter/block.ts`. Keep its empty Composition beside completion rather than creating a separate `composition.ts`:

::Snippet{name="organizationGraphlessBlock" label="Small graphless feature"}

## File Layout

Split a module when separate responsibilities make it easier to navigate. The following structure shows optional homes for those responsibilities; do not create empty files to match it.

::Snippet{name="fileLayout" label="Application and feature file structure"}

Use standard structural names within each feature: `Model`, `Message`, `OutMessage`, `Flags`, `init`, `update`, `view`, `subscriptions`, `managedResources`, `mounts`, and `EffectsLayer`. The feature namespace supplies context in parent code, such as `Home.Model` and `Home.Message`. Domain Schemas and individual effects retain descriptive names such as `Person`, `FetchPeople`, and `FocusSearchInput`.

### Early Contracts and Local Effects

Keep `definition.ts` focused on the early typed Definition and its Model, Message, and OutMessage contracts. Split implementation files import that Definition without loading the completed feature. A compact feature need not extract it.

Commands belong to the feature whose update returns them. Keep small definitions beside update; extract `command.ts` when several definitions or substantial handlers make a separate file useful. Extract `message.ts` when handlers need result constructors and importing the update would create a cycle.

Put shared local Mount definitions in `mount.ts`. Both Composition and view import them from that module. Defining a Mount inside `view.ts` would make Composition import the view that already imports Composition.

### A Feature with a Child

For a split feature, `composition.ts` owns its child Bindings, complete child and Mount registration lists, and single `FeatureComposition` value. A new straightforward Binding goes immediately beside that `toComposition` call. For example, `dashboard/composition.ts` connects a Counter:

::Snippet{name="organizationChildComposition" label="Child Binding and registration"}

An update can import `counter` to forward its Messages or invoke its exposed operations. The view imports `DashboardComposition`. Including `counter` under `children` also includes the completed child's handler graph and lifecycle declarations.

`block.ts` imports the Composition, init, update, view, and local `EffectsLayer`, then calls `DashboardComposition.toBlock`. Its explicit `index.ts` exports `block`, public contracts, and intentional domain helpers. Internal implementation files do not import their own completed barrel.

### A Feature with Mounts Only

A split Mount-only feature also uses `composition.ts`. The Composition assembles capabilities whether or not it has children. For example, `panel/composition.ts` registers the Mount from `panel/mount.ts`:

::Snippet{name="organizationMountComposition" label="Mount-only Composition"}

The view imports both the Composition and the local Mount definition:

::Snippet{name="organizationMountView" label="View using its registered Mount"}

Registration grants the view permission to use the Mount. Completion supplies its handler recipe through the local `EffectsLayer`:

::Snippet{name="organizationMountBlock" label="Mount handler at Block completion"}

### Substantial Binding Policy

A Binding also contains the parent's integration policy for its child. Extract a supporting file when that policy includes substantial OutMessage handling, custom Model writes, or Command lifting. For example, an Editor's Dialog policy may save the draft when the Dialog closes:

::Snippet{name="organizationDialogPolicy" label="Extracted Dialog integration policy"}

Put that policy in `editor/composition/dialog.ts`. The single assembly point becomes `editor/composition/composition.ts`, with an explicit `composition/index.ts` barrel. Straightforward Bindings remain in the assembly file alongside the complete registrations:

::Snippet{name="organizationPolicyComposition" label="Feature assembly with an extracted policy"}

The directory barrel exports the intended assembly surface explicitly:

::Snippet{name="organizationCompositionBarrel" label="Explicit Composition barrel"}

Do not create arbitrary groups such as pages or controls, a second children list, or a global list of Bindings. At the root, supporting files can use the same `composition/<child>.ts` path, but `application.ts` remains the assembly point; it imports those policies directly.

### Views, Behavior, and Import Direction

Author the primary view through `FeatureComposition.view` or `view.withInputs`. When extracted helpers need its builder type, export `type ViewBuilder = Block.HtmlBuilderOf<typeof FeatureComposition>` beside the Composition. Ordinary view helpers receive that builder and the Model, domain value, or context they use. The alias retains Message, child, and Mount capabilities without constructing anything at runtime. Helpers shared across features can use the general `HtmlBuilder` type.

Keep substantial behavior in `init.ts`, `update.ts`, or a folder-named implementation file such as `workHistory/workHistory.ts`. A substantial `update/` directory uses `index.ts` as its explicit barrel and `update.ts` as the Message matcher. Extract substantial handlers by behavior; keep trivial child forwards and unchanged results in the matcher. The same rule gives a view directory `view/index.ts` and `view/view.ts`.

Dependencies point from contracts to local declarations and policies, then to Composition, view, and completed Block. An update or view can import a Binding from Composition. Composition must not import the update matcher, primary view, or completed Block in return. If child policy needs a parent Step, define the policy beside the Binding or extract the pure operation into a leaf module that does not depend on Composition.

Keep route policy shared by init and navigation outside `update/`, for example in `routePolicy.ts`. `Transition.coldLoad(route)` and `Transition.make(previousRoute, nextRoute)` can share enter, exit, and stay decisions. Keep optional child Models and the choice of init Commands explicit. Browser environment setup, link handling, and scrolling have separate responsibilities.

## Root Application Assembly

`application.ts` owns the complete root child and Mount graph, `ApplicationComposition`, and the root-local handler bundle. Put straightforward root Bindings directly beside the `Application.toComposition` call. Extract substantial policies to files such as `composition/home.ts`; do not add another root `composition.ts` around the assembly.

::Snippet{name="applicationRegistrations" label="Root child graph and local handlers"}

For a compact root, define `Application` there too. When root Commands, Subscriptions, or policies need its helpers before graph assembly, keep the early Definition in `definition.ts`. `application.ts` imports and intentionally re-exports `Application`. Model and Message Schemas remain in their own files when substantial.

Root `services.ts` composes `ApplicationLayer`. The entry imports it and each completion field from its real owner, chooses browser inputs, and invokes the Runtime:

::Snippet{name="applicationEntryPoint" label="Browser application entry point"}

Keep browser container lookup, routing callbacks, DevTools configuration, and startup Flags visible in `entry.ts`. Tests and server entries import the passive Composition and implementation pieces without starting the browser Runtime. Do not collect unrelated root behavior in `root.ts` or aggregate Subscriptions in a vague `lifecycle.ts`; use `subscription.ts` or `subscription/subscription.ts`.

## Composing Handler Layers

Keep canonical handlers attached to their Command, Subscription, Mount, and ManagedResource definitions. Compose attached recipes such as `LoadProducts.layer` in the feature's local `EffectsLayer`. Name a standalone `LoadProductsLayer` only when that individual provider is intentionally public or independently reused, and an external alternative `LoadProductsTestLayer`.

Compose a small local bundle in `block.ts`. Extract `layer.ts` when the composition is substantial or independently reused. Pass the local bundle to `FeatureComposition.toBlock`. A feature can provide business services that it owns while leaving HTTP, storage, RPC, and browser providers open for the root.

::Snippet{name="applicationFeatureLayer" label="Feature handler Layer composition"}

Products supplies `ProductCatalogLayer` beneath its local handlers. The catalog's external dependencies remain requirements of the root's production or test provider.

### Local Handlers and the Complete Graph

A module named `command.ts` exports `Command.EffectsLayer` for the Command handlers owned by that module. At the root, this bundle contains root-owned Commands only. `application.ts` combines it with other root-local handler bundles, such as Subscription handlers.

Registered child Blocks contribute their own selected `EffectsLayer` recursively. Completing the Application includes that transitive handler graph automatically. Do not manually import or relist every child Command at root, and do not merge a registered child's handler bundle a second time.

There is no flattened, human-readable list of every Command Layer in an Application today. To inspect the handlers, follow `ApplicationComposition`'s registered children into each completed Block and its local `EffectsLayer`. Keep that graph as the source of truth rather than maintaining a second global list.

### Ordinary Service Providers

Root `services.ts` chooses concrete HTTP, storage, RPC, and browser providers and exports `ApplicationLayer`:

::Snippet{name="applicationRootLayer" label="Root service Layer composition"}

`LocalStorageLayer` and `SessionStorageLayer` implement distinct application service tags, so both stores coexist. `ApplicationTestLayer` supplies deterministic alternatives beneath the same real handler graph. Adding a feature handler changes its local `EffectsLayer`; changing a provider changes `ApplicationLayer`. Neither requires another provision call in `entry.ts`.

## Composing Runtime Behavior

A feature's `EffectsLayer` supplies handlers. Its Subscriptions, ManagedResources, and Mounts declare the lifecycle work Foldkit manages. The root `Application.toComposition` call includes the child graphs through their registered Bindings.

The Binding's storage and Message mapping connect child work to the parent. A direct Option field containing `None`, a false `presentWhen`, or a custom reader returning `None` stops that child's lifecycle work. A keyed Binding creates independent scopes for active keys. The same Binding supplies update folding and `embedView`.

Stateful UI components compose in the same way. Include a component Binding in `children` to collect its handlers, lifecycle declarations, and Mount evidence. View-only components need no Binding.

When a parent update needs an explicit requirement union, derive it from the child update and Command-producing helpers. Do not derive update requirements from `Layer.Success<typeof Child.EffectsLayer>`: that bundle may also implement lifecycle handlers the update never requests.

## Where Tests Live

### Test Within the Owning Feature

Colocate tests with the boundary they exercise. A feature's `story.test.ts` drives its update. Its `scene.test.ts` drives its view, using `withViewInputs` when the view requires them.

Test rendering, interactions, Commands, and OutMessages inside the feature that owns them. Test at the parent when the contract involves parent-computed ViewInputs, wrapper routing, a lifted Command, or the parent's response to an OutMessage.

### Test Cross-Feature Flows at the Root

Keep root Scene tests for flows that cross features or pages. Split several root flows by subject, such as `checkout.scene.test.ts` and `cart.scene.test.ts`.

When one folder holds more than one test of a kind, prefix with the subject, like `login.story.test.ts`. Pure modules in `domain/` need neither primitive; they take ordinary Vitest tests beside them.

See the [Testing](/testing) page for the full Story and Scene reference.

When a test starts the full application, compose the production feature Layers with test implementations of their external services before building the application Layer. This runs real Command, Subscription, Mount, and ManagedResource handlers. Replace a whole handler only when the test intentionally supplies its result or lifecycle path; that narrower orchestration test does not cover the replaced handler.

## Domain Modules

Put shared business concepts in `domain/`. Each module owns its Schema and pure operations.

::Snippet{name="domainModule" label="Domain module"}

Import the module as a namespace and call operations such as `Cart.addItem` and `Cart.removeItem`.

## Index Re-exports {#index-reexports}

Use `index.ts` only as a barrel. Re-export intended names explicitly so adding an internal export does not expand the public API. Use `export *` only when the entire module surface is intentionally public. Re-export the completed `block` from the feature's completion file, then export that feature folder as a namespace at the parent barrel. The namespace keeps `block`, Model, Message, OutMessage, and intentional public domain helpers together without hiding where they came from. Keep lifecycle registries and other implementation details out of the barrel. Focused tests can import a private implementation from its owning module without turning test access into a general public contract.

::Snippet{name="indexReexports" label="Index re-exports"}

Consumers import feature and domain modules as namespaces.

::Snippet{name="indexUsage" label="Completed features and domain namespaces"}

`Products.` exposes the feature's public surface without revealing its internal file layout. Parent composition starts from `Products.block`.

### Keep Barrel Dependencies Pointing Inward

A parent barrel may re-export each immediate child namespace, and application code may import those namespaces from the barrel. The exported child modules must not import the application root in return. If `message.ts` imports `Home` from `page/index.ts` while a module re-exported by `page/index.ts` imports that root Message, the barrel closes a circular dependency.

Within a feature, import implementation pieces from their owning modules rather than from the feature's own completed barrel. Early contract modules can import a child's Model or Message directly when loading its completed namespace would close a cycle.

Keep shared leaf modules independent of the root. Pass parent-owned rendering capabilities through function arguments or Block `viewInputs`, and make stateful shared behavior its own Block. The parent then provides the capability at the view boundary while each Page remains importable through the one-level barrel.
