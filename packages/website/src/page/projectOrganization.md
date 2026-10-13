# Project Organization

Start a Foldkit application in one module. Split it when a feature becomes easier to understand as its own state machine.

## Starting Simple

The smallest application keeps Model, Message, init, update, view, and its typed Application definition in `application.ts`. A separate `entry.ts` chooses the browser container and startup inputs, supplies shared services, and starts the Runtime. Tests and server tooling can then import `application.ts` without booting the application or reading browser globals as a side effect.

Add `story.test.ts` and `scene.test.ts` beside it. The [Counter example](/example-apps/counter) shows this layout.

## File Layout

When one file becomes hard to navigate, separate the root pieces and give each [Block](/core/block) its own feature folder.

::Snippet{name="fileLayout" label="Recommended application structure"}

### Give Each Feature Its Own Files

Each feature folder owns its Model, Message, update, view, Commands, Subscriptions, Mounts, ManagedResources, handler Layers, and tests. Do not create empty files only to match the diagram. Add a file when the feature has that concern.

In the diagram, `products/service.ts` owns the feature's `ProductCatalogLayer` business service. The feature's local `EffectsLayer` provides it beneath the product handlers. Root `environment.ts` owns concrete HTTP, RPC, and browser provider Layers. Root `storage.ts` defines separate `LocalStorage` and `SessionStorage` service tags and binds them to their platform providers. Applications that do not need those concerns omit the files.

Keep Commands within the feature whose update returns them. Small features can declare them alongside update; extract a feature-local `command.ts` when several definitions or substantial handlers make a separate file easier to navigate. A feature that fetches its own data owns that Command instead of importing it from a root Command collection. Extract `message.ts` when a Command needs to import its result Message constructors without creating a cycle.

A feature that declares Subscriptions can own `subscription.ts`. Put its early typed authoring declaration in `block.ts` when split implementation files need it: `export const Home = Block.define('Home', { Model, Message })`. Assemble the completed Home Block in `home/home.ts`, export it as `block` from `home/index.ts`, and export the folder as `Home` from `page/index.ts`. Parents import the namespace and call `Home.block.connection(...)` or `Home.block.keyedConnection(...)`. Registering that connection under `children` includes the child's lifecycle records automatically. See [Defining a Block](/core/block#child-block).

Use standard structural names within each feature: `Model`, `Message`, `OutMessage`, `Flags`, `init`, `update`, `view`, `subscriptions`, `managedResources`, `mounts`, and `EffectsLayer`. The feature value supplies context in parent code: `Home.Model` and `Home.Message`. Domain Schemas and individual effects keep descriptive names such as `Person`, `FetchPeople`, and `FocusSearchInput`.

### Split a Feature When It Grows

Split a large feature again only when its own files become difficult to navigate. The [Typing Terminal room source](https://github.com/foldkit/foldkit/tree/main/packages/typing-game/client/src/page/room) has `view/` and `update/` subfolders inside one Room feature.

## Composing Handler Layers

Keep each handler attached to the Command, Subscription, Mount, or ManagedResource definition it implements. Compose `LoadProducts.layer` or `subscriptions.productUpdates.layer` directly in the feature's `EffectsLayer`. Name a standalone binding `LoadProductsLayer` only when that individual provider is intentionally public or independently reused outside `EffectsLayer` assembly, and name an external alternate `LoadProductsTestLayer`. The handler owns the translation from Foldkit args or dependencies into an Effect or Stream. External clients stay in its Effect requirements.

Compose a small local `EffectsLayer` directly in the feature's assembly file. Extract `layer.ts` when that composition is substantial or independently reused. Pass this local bundle to `Home.assemble` or the registered feature's `.assemble`; registered child connections contribute their selected handler graphs. A feature may provide business services that it owns while leaving concrete HTTP, storage, RPC, and browser providers open for the application root. Import Effect's module as `Layer`; the bundle has a different name, so no alias is needed.

Root `application.ts` owns the typed `Application`, its optional registered composition, and the portable implementation record. `entry.ts` handles browser startup, container selection, startup inputs, and `Runtime.run`. Root `services.ts` exports `ApplicationLayer` and any alternate `ApplicationTestLayer` containing ordinary service providers. Keep substantial Model, Message, update, and view logic in their respective files. This layout keeps application imports from starting a browser Runtime.

The feature Layer contains only handlers owned at that boundary. Child connections contribute their own graphs, including keyed connections.

::Snippet{name="applicationFeatureLayer" label="Feature handler Layer composition"}

Products provides `ProductCatalogLayer` privately inside its `EffectsLayer` bundle. The catalog's external dependencies stay open for the root's production or test providers.

The root definition receives top-level feature connections under `children`, so their handler graphs arrive through composition. The root's local `EffectsLayer` contains only handlers it owns. Root `services.ts` chooses the concrete service providers for the environment where the app runs.

::Snippet{name="applicationRootLayer" label="Root service Layer composition"}

`LocalStorageLayer` and `SessionStorageLayer` implement distinct application service tags, so both stores can coexist without changing the platform `KeyValueStore` identity inside either provider. `ApplicationLayer` provides production Services; `ApplicationTestLayer` provides deterministic alternatives beneath the same handler graph carried by the root Application definition.

The entry imports the root definition and implementation with `ApplicationLayer`. It completes the definition with `.make`, calls `application.provide(ApplicationLayer)`, and starts the result. The DOM container, routing callbacks, DevTools configuration, and startup Flags remain visible in `entry.ts`; `application.ts` stays portable for tests and server rendering.

::Snippet{name="applicationEntryPoint" label="Browser application entry point"}

Adding another handler changes the owning feature's local `EffectsLayer`; changing an environment provider changes the root service Layer. Neither adds another provision step to `entry.ts`. A test root supplies alternate Services beneath the same handler graph, so whole-application execution keeps the real handlers. See [Providing application services](/core/runtime#overview) for the entry code.

## Composing Runtime Registrations

Handler Layers and runtime registrations have different jobs. A feature's `EffectsLayer` supplies implementations. Its Subscriptions, ManagedResources, and Mounts say which behavior Foldkit manages. The root `Application.register` call collects those graphs through child connections while preserving the root's update, step, Subscription, ManagedResource, Command, Mount, and Resource authoring helpers.

::Snippet{name="applicationRegistrations" label="Root runtime registration composition"}

The connection's `read` and `toParentMessage` connect every child lifecycle to the parent. Optional children stop lifecycle work when `read` returns `None`. A keyed connection creates independent scopes for every active key. The same connection also owns update folding and `embedView`, so these channels cannot drift apart.

The registered definition owns `.make`. `entry.ts` imports that definition and the portable implementation, adds browser host configuration, supplies `ApplicationLayer`, and starts the application. It does not import feature Commands, Subscription handlers, Mount handlers, ManagedResource handlers, or leaf `EffectsLayer` bundles.

The same propagation applies to stateful UI components. Register a component connection, such as a connected Combobox, in the parent's `children`; the parent collects its handlers, lifecycle registrations, and Mount evidence. View-only components need no connection.

When a parent update needs an explicit requirement union, derive each child branch from `Update.RequirementsOf<typeof Child.update>` and include other Command-producing helpers. Do not derive it from `Layer.Success<typeof Child.EffectsLayer>`: a feature effect bundle may also implement Subscriptions, Mounts, or ManagedResources that the update never returns.

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

Use `index.ts` only as a barrel. Re-export the completed `block` from the feature's assembly file, then export that feature folder as a namespace at the parent barrel. The namespace keeps `block`, Model, Message, OutMessage, and public operations together without hiding where they came from. Domain helpers and lifecycle registries may remain ordinary exports when consumers or tests address them directly.

::Snippet{name="indexReexports" label="Index re-exports"}

Consumers import feature and domain modules as namespaces.

::Snippet{name="indexUsage" label="Completed features and domain namespaces"}

`Products.` exposes the feature's public surface without revealing its internal file layout. Parent composition starts from `Products.block`.

### Keep Barrel Dependencies Pointing Inward

A parent barrel may re-export each immediate child namespace, and application code may import those namespaces from the barrel. The exported child modules must not import the application root in return. If `message.ts` imports `Home` from `page/index.ts` while a module re-exported by `page/index.ts` imports that root Message, the barrel closes a circular dependency.

Keep shared leaf modules independent of the root. Pass parent-owned rendering capabilities through function arguments or Block `viewInputs`, and make stateful shared behavior its own Block. The parent then provides the capability at the view boundary while each Page remains importable through the one-level barrel.
