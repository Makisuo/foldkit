# Layers

## Overview

An Effect Layer is a recipe for constructing services and managing their lifetime. Foldkit uses Layers for shared application services and for handlers that implement Commands, Subscriptions, Mounts, and ManagedResources. The Runtime builds the application Layer once when the application starts and releases its scoped resources when the application stops.

:::Info{label="Think of it like a restaurant kitchen"}
Shared services are the kitchen equipment available all night. Every dish can use the same oven. A Model-driven handle, such as a camera stream, belongs to a [ManagedResource](/core/managed-resources) instead: it exists only while the Model needs it.
:::

The typed root Composition's owned `ApplicationComposition.toApplication` method completes the application and carries its unsatisfied Effect requirements. `application.provide(layer)` adds the application Layer and returns a new passive program. `Runtime.run` builds that Layer when it starts the program. Command execution, Subscription restart, Mount insertion, and ManagedResource acquisition reuse the handlers and services that Layer built. A hydrating start validates the server handoff before acquiring the Layer.

A Command definition names the operation and its result Messages. Its `config.handler` is a generator constructor that captures any services the implementation needs, then returns the function that handles each invocation. Foldkit applies `Effect.gen` internally. The definition's `.layer` is the recipe application assembly provides. `Layer.provide` composes service Layers beneath that handler Layer. Subscriptions, Mounts, and ManagedResources use the same constructor boundary.

::Snippet{name="layers" label="Shared API client service"}

The completed feature includes the real handler through `EffectsLayer = LoadUser.layer`. `ApplicationLayer` supplies `ApiLayer`; `ApplicationTestLayer` supplies `ApiTestLayer`. The API client starts once with the application, rather than once per `LoadUser` execution. This substitution exercises the real `LoadUser` mapping and error policy. Code inside the replaced `ApiLayer` is outside that test path.

Setting `config.handler` creates the Definition's `.layer` recipe through the same construction path and handler identity that `toLayer(constructor)` uses. Include that recipe in the feature's local `EffectsLayer` and pass the bundle to `FeatureComposition.toBlock`. Binding the feature carries that handler graph to the root. Foldkit does not search for attached handlers omitted from the completed graph.

The handler generator runs once when the Runtime builds the application Layer, including constructors for handlers that are never invoked. For a Command, the function it returns receives serializable args each time the Command runs. For a Subscription, the returned function receives the current Model dependencies each time Foldkit starts or restarts its Stream. Mount and ManagedResource handlers likewise receive their element or Model-scoped requirements when that lifecycle begins.

Use `function* ()` to capture services, then return the invocation function. Foldkit applies `Effect.gen` around the generator. When construction has no work to perform, return the handler directly from the generator. The consistent shape makes application dependencies visible in the Layer graph even for a small handler.

If an existing Effect or Stream already declares its service requirements, return it from the invocation function. The handler Layer carries those requirements to application assembly and captures the supplied Context. Contextual lookups use the invocation Context over the construction Context. Yield a service when the returned function needs to call the captured object directly; yielding it solely to re-provide the same instance to an existing operation adds unnecessary plumbing.

Do not capture current time, Command args, Subscription dependencies, a Mount's element, or an active ManagedResource handle. Those values belong to the shorter-lived operation or lifecycle that supplies them. Looking up a service in the constructor retrieves the instance built for the application; the lookup does not construct its provider again.

## Handler and Service Requirements

Handler Layers separate the operations that the update function requests from the services used to implement them. An update that returns `LoadUser({ userId })` requires the `LoadUser` handler. Its implementation requires `ApiClientService`.

Suppose the handler also records successful loads through a `Telemetry` service. The constructor now obtains both services, and the returned function calls them when the Command runs. `LoadUser.layer` requires both services. The emitted Command requires `Command.HandlerOf<typeof LoadUser>`, so update and the parent updates that lift its Commands carry the same handler requirement.

Compare that with a Command carrying the implementation Effect directly. Its Effect requires every service the implementation uses. Adding telemetry changes that requirement from `ApiClientService` to `ApiClientService | Telemetry`, which flows through update and its parent folds.

| Requirement carried by                  | Before adding telemetry | After adding telemetry          |
| --------------------------------------- | ----------------------- | ------------------------------- |
| A Command with an inline implementation | `ApiClientService`      | `ApiClientService \| Telemetry` |
| A Command produced by `LoadUser(...)`   | `LoadUser` handler      | `LoadUser` handler              |
| The handler provider `LoadUser.layer`   | `ApiClientService`      | `ApiClientService \| Telemetry` |

Application assembly must supply the new telemetry dependency before `Runtime.run` accepts the application. An incomplete provider composition carries `Telemetry` as an unsatisfied requirement until the root supplies it. If that requirement reaches `Runtime.run`, TypeScript rejects the application. The update and its parent folds require the `LoadUser` handler throughout.

Every handler requirement also carries the definition's complete invocation protocol. The public annotation forms are:

| Primitive       | Exact annotation                                            | Preferred derived annotation                               |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Command         | `Command.Handler<Name, Args, DeclaredMessage>`              | `Command.HandlerOf<typeof CommandDefinition>`              |
| Subscription    | `Subscription.Handler<Name, Dependencies, DeclaredMessage>` | `Subscription.HandlerOf<typeof subscriptions.entry>`       |
| Mount           | `Mount.Handler<Name, Input, DeclaredMessage>`               | `Mount.RequirementsOf<typeof MountDefinition>`             |
| ManagedResource | `ManagedResource.Handler<Name, Params, Value>`              | `ManagedResource.HandlerOf<typeof managedResources.entry>` |

The expanded types require every protocol argument. Use the derived annotation when a signature needs an explicit requirement. Definitions, update helpers, Block Bindings, completed handler graphs, and attached Layer recipes carry these requirements automatically.

Owned definitions include the named Block and local operation name in their handler contracts. `FeatureComposition.toBlock` compares the feature's local requirements with the outputs and inputs of its `EffectsLayer`, or with definitions explicitly listed in `hostHandlers`. A host then uses `block.provideHandlers` to satisfy those declared contracts. Parent Bindings carry the checked handler graph; the completed application or Element's `provide` method supplies its remaining ordinary service requirements.

Definitions created by different named Blocks receive different owned names even when their local names and protocols match. Each definition also retains a private runtime identity, which Foldkit checks when a Command runs, a Subscription starts, a Mount executes, or a ManagedResource lifecycle begins. Create alternate implementations through the original definition's `toLayer` so they keep its identity. Foldkit creates the handler service and its runtime identity from the definition.

An inline Effect can also carry typed dependencies and use replaceable services. Defining a separate operation service yourself can achieve the same separation. Foldkit generates that service boundary from each definition and uses it across Commands, Subscriptions, Mounts, and ManagedResources. The cost is explicit handler Layer composition, even for a small implementation.

## Testing Through Service Boundaries

Whole-application execution tests retain the real Command, Subscription, Mount, and ManagedResource handlers. Replace the dependency Layers beneath those handlers before the Runtime builds the application Layer: an API client, storage service, RPC transport, clock, or browser capability. This exercises the application's real effect translation and lifecycle behavior while making the external environment deterministic.

Choose the lowest service boundary whose code the test needs to exercise. If `ApiLayer` contains request construction, authentication, decoding, retries, or other business behavior, keep `ApiLayer` and replace its lower HTTP or RPC transport. Replacing `ApiLayer` with `ApiTestLayer` deliberately narrows the test to code above that service.

For a Subscription, the test service supplies the upstream events while the real handler still builds the Stream and Foldkit still starts, restarts, and stops it from Model dependencies. For a Mount, the test capability sits beneath the real element-scoped handler. For a ManagedResource, the test capability sits beneath the real acquire and release handler, so the Model-driven handle scope remains under test.

A handler stub can drive a result path directly, but it does not test the handler that was replaced. Ordinary execution tests need no new testing DSL: compose the production `.layer` recipes with test Layers for the external services, then execute the application or operation through Effect.

## Host Implementations for Reusable Features

A reusable feature can define an operation and require the application using it to supply the implementation. The feature owns the Command's args and result Messages. Its update returns that Command, and the host decides how to perform the operation.

For example, an editor feature can declare `SaveDocument` without choosing where documents are stored:

::Snippet{name="commandHostContract" label="Editor declaring its save operation"}

The editor's update returns `SaveDocument({ contents })` when the user requests a save and handles `SucceededSaveDocument` or `FailedSaveDocument` when it finishes. Omitting `handler` gives the definition no `.layer`. The editor requires `Command.HandlerOf<typeof SaveDocument>`, which its parent carries to application assembly.

A standalone host can implement this contract using browser storage:

::Snippet{name="commandHostImplementation" label="Host saving a document to browser storage"}

The host constructs `SaveDocumentLayer` with `SaveDocument.toLayer`, then calls `Editor.provideHandlers(SaveDocumentLayer)` before connecting that feature. `ApplicationLayer` supplies the storage service beneath the selected handler graph. Without a provider for `SaveDocument`, composition retains that requirement and TypeScript rejects the completed application.

The same editor could be used inside a publishing application whose host saves through its document API. Both hosts use the editor's Command definition and report its declared result Messages, so the editor's Model and update need no storage-specific branches.

Use a host implementation when the operation's behavior belongs to the host. If the feature owns the save workflow and its result mapping, attach its constructor and let the host provide the storage or API service beneath that handler. Ordinary execution tests retain whichever handler the application uses and substitute its underlying services.

## State in Handlers

Handlers and services can own mutable execution bookkeeping. The Model owns the application state used by update and view. Pass per-dispatch inputs through Command args, and report results through Messages so update can change the Model.

For an asset editor, the Model records the requested thumbnail jobs and their results. A handler can own the worker pool that performs those jobs. The workers' availability controls how the work executes; update decides which jobs to request.

| State                                         | Owner                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Worker availability and lease bookkeeping     | A handler's resource pool, or a shared service                                     |
| Worker request IDs and response callbacks     | The worker client's protocol bookkeeping                                           |
| Cached deterministic calculations             | A handler or service, with cache keys covering every input that affects the result |
| Selected document and submitted form contents | The Model, passed to the Command through args                                      |
| Pending thumbnail jobs and their results      | The Model, updated through result Messages                                         |
| Whether the user may submit another message   | The Model and update                                                               |

An `isSending` Ref in a handler that rejects another `SendMessage` invocation hides a submission rule from the Model. A Story can observe two submissions each returning a Command while the running handler rejects one using state that update never sees. Represent the request state as Model variants such as `Idle` and `Sending`. Let update decide whether a submission returns a Command, and handle its success or failure Message to leave `Sending`.

Moving that flag into a service leaves the application decision outside the Model. Stateful clients can manage connections, protocol correlation, and resource availability; application workflow transitions belong in update. An ongoing external event source belongs in a [Subscription](/core/subscriptions), rather than a background constructor task that advances application state independently.

### Preparing Execution Resources

A constructor can create an operation-specific pool with `Pool.make` or acquire a private resource with `Effect.acquireRelease`. Those resources belong to the application Layer's Scope and release when the application stops. For pooled resources, register each item's cleanup in its acquisition Effect. Put a pool used by several handlers in a shared service. Keep concrete platform providers selectable at root; a handler can obtain a resource factory service there and prepare its own machinery.

Constructors run during application startup even when their handlers are never invoked. Acquisition that fails in the constructor fails startup before a Model exists. When loading, failure, or retry needs to appear in the UI, perform that work in a Command invocation or a [ManagedResource](/core/managed-resources) and report the outcome through Messages. Resources that exist only while a Model condition holds belong in a ManagedResource; work tied to a live element belongs in a [Mount](/core/mount).

## Choosing the Lifetime

Put a value in the scope that owns its start and stop:

| Lifetime              | Use it for                                       | Examples                                                 |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| One Runtime start     | Shared Effect services and constructed handlers  | RPC clients, repositories, analytics clients             |
| One Command execution | Work and values produced for one dispatch        | Current time, request args, one HTTP response            |
| A Model condition     | Subscription Streams and ManagedResource handles | Route-scoped events, a connected socket, a camera stream |
| One mounted element   | Mount acquisition and cleanup                    | Element observers, chart instances, anchored overlays    |

The application Layer may construct a stable service or handler accessor. It must not move values from the other three scopes into application lifetime. A current timestamp changes per Command. Subscription dependencies change with the Model. A ManagedResource handle exists only while its Model condition holds. A Mount's `Element` exists only for that mounted node.

## Application and Private Provider Lifetimes

Put concrete HTTP, storage, RPC, and browser providers in the application root by default. This gives production and whole-application tests one visible substitution boundary while the feature keeps its real handlers.

| Question                         | Application-root provider                          | Private `Effect.provide`                           |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| How often is the Layer built?    | Once when the application starts.                  | Once per operation execution.                      |
| Do operations share an instance? | Yes, when their handlers require the same service. | No. Each execution gets a fresh instance.          |
| Where can a test substitute it?  | At the root, while retaining every real handler.   | Only inside a direct test of that private Effect.  |
| What if construction fails?      | Application startup fails before the first render. | The operation handles the failure at its boundary. |

Use a private provider only when the operation deliberately owns that provider and the application should not select or share it. This closes the provider inside the Effect, so the root cannot replace it for a whole-application execution test.

When an application needs localStorage and sessionStorage at the same time, define distinct application service tags such as `LocalStorage` and `SessionStorage`. Bind each tag to its platform `KeyValueStore` Layer at the root. The tags preserve both identities without hiding either provider inside a Command.

Define `ApplicationLayer` in root `services.ts`, then import it in the entry:

::Snippet{name="layersPerCommandHttpServices" label="Shared HTTP service provider"}

::Snippet{name="layersPerCommandHttp" label="HTTP provider at the application root"}

Foldkit’s `Http.layer` uses Effect’s Fetch-backed client with trace-header propagation disabled. Browser `traceparent` headers can turn otherwise CORS-simple requests into preflighted requests against plain APIs and development proxies. The application root provides it to the Application composition’s handler graph; a test root can provide `HttpTestLayer` to the same handlers.

## Services in Flags

Flags remain startup Effects rather than handler definitions. The Flags Effect can require services too. `Runtime.run` resolves Flags before calling init, so an application Layer that supplies a Flags dependency must build during startup.

The root `services.ts` defines the session client and combines its provider with `Http.layer`:

::Snippet{name="layersFlagsServices" label="Session service and application provider"}

The Flags Effect consumes the session client supplied by that Layer:

::Snippet{name="layersFlags" label="Flags consuming a service"}

The entry completes the split Application from each implementation owner, then supplies the same Layer to the Application and Flags Effect:

::Snippet{name="layersFlagsEntry" label="Entry resolving Flags"}

If the service Layer fails to build, startup cannot reach init or the first render. There is no Model for a crash view yet. A service used only by one Flags Effect may be private to that Effect when the application should never select or share it. Shared services stay exposed from the root Layer with `Layer.provideMerge` so Flags and handlers receive the same instance.

`ApplicationComposition.toApplication` carries requirements from init, update, Subscriptions, composed Mounts, and ManagedResources. `Runtime.run` requires those requirements to be supplied. A Flags Effect can use a service produced by a Layer passed to `application.provide(layer)`, as shown above.

## Layer Naming and Composition

Import Effect's `Layer` module as `Layer`. Compose a small feature's attached recipes, such as `LoadUser.layer`, directly in `block.ts` as its local `EffectsLayer`. Extract `layer.ts` when that composition is substantial or independently reused. Create a standalone `LoadUserLayer` binding only when that individual provider is intentionally public or independently reused outside `EffectsLayer` assembly, and name an external alternate `LoadUserTestLayer`. Pass the local bundle to the completed Block. Export `block` from the feature barrel, then export `* as Search` from the parent barrel. Parents call `Parent.bindChild(Search.block, config)`; the Binding carries its selected handler graph automatically.

An owned Block passes its local handler bundle to `FeatureComposition.toBlock({ EffectsLayer })`. A parent that includes the child Binding in `Parent.toComposition({ childBindings: [ChildBinding] })` receives the child's complete `EffectsLayer` automatically, including its descendants. The parent composes only its own local handler recipes. Repeating this at each Block boundary produces one root graph without making the entry point import every leaf implementation.

Do not merge a registered child's bundle a second time. `bindChild` configures the relationship; including the returned Binding in `toComposition({ childBindings })` contributes its recipes for static, optional, and keyed placements. Composition checks the exact handler contracts supplied by the graph and reports a missing or conflicting provider before the Runtime starts.

At a split root, `composition.ts` or `composition/composition.ts` shows the complete child/Mount registration. A `command.ts` namespace's `Command.EffectsLayer` includes only the Command handlers owned by that module. Keep a simple root `EffectsLayer` with those Command definitions in `command.ts`; extract `layer.ts` only when the local Layer composition is substantial or reused. Registered child Blocks contribute their own handlers recursively through the completed graph; root code does not relist them.

There is no flattened, human-readable handler inventory today. To inspect an Application's handlers, follow its registered children into each completed Block and local `EffectsLayer`. Do not maintain a second global list.

At the root, the Application Composition contains the local handlers and composed child graphs. `ServicesLayer` combines concrete HTTP, storage, RPC, and browser providers. `ApplicationLayer` contains those ordinary service providers. `ApplicationComposition.toApplication({ init, update, view, ... })` or `.toElement(...)` packages the handler graph into the passive runtime input, and `application.provide(ApplicationLayer)` supplies its remaining service requirements. An `ApplicationTestLayer` can provide alternate services to the same handlers.

When a feature needs a different local handler implementation, choose it with `block.replaceEffectsLayer(localRecipe)` before binding the feature. The replacement preserves the selected descendant recipes and remains passive until application startup. Use the original definitions' `toLayer` methods to retain their protocol and runtime identity. See [Selecting a local handler recipe](/core/block#select-a-local-handler-recipe).

Use `Layer.mergeAll` to combine a feature's local recipes in `EffectsLayer`. A feature may provide a business service it owns beneath that bundle. Leave concrete environment providers as requirements for the root to choose. The composed graph preserves those ordinary service requirements through every parent; the root `ApplicationLayer` supplies them once for the whole runtime. A compact root exports `Application` and `ApplicationComposition` from its all-in-one `application.ts`. A split root exports `Application` from `definition.ts` and `ApplicationComposition` from `composition.ts` or its composition barrel, with no root `application.ts` aggregation file. Each implementation piece stays with its real owner, and `entry.ts` imports those fields explicitly for `ApplicationComposition.toApplication`. Root `services.ts` composes `ApplicationLayer`, and the entry imports it.

::Snippet{name="layersMultiple" label="Multiple shared services"}

The provider Layer and its handler Layers live for the application runtime. Resources acquired in their Scope release when the runtime stops. When a camera stream, `WebSocket`, or other handle should exist only while the Model is in a particular state, use [Managed Resources](/core/managed-resources) instead.

## UI Effects and Mount Registrations

Bind a completed UI Block and include that Binding in the parent's `childBindings` list. Its handler recipes and Mount registrations then reach the parent together. This keeps the implementation graph aligned with the update and view placement.

View-only components need no Block. Stateful Foldkit UI components are completed values such as `Dialog.block` and `Combobox.block`; bind each used placement, including keyed collections, and include those Bindings under `childBindings`.

Component factories such as a Schema-refined Combobox return a completed Block with the factory's inferred Model, Message, OutMessage, view inputs, and public API operations. Bind the returned value exactly like a non-generic component.

Including Mounts in a Composition gives its view builder the allowed Mount contracts and adds their handler requirements to the application. TypeScript rejects a Mount outside that capability set or an embedded child view whose Mount requirements are missing. `FeatureComposition.view` derives this evidence from the local `mounts` and child Bindings. Providing the handler Layer satisfies execution; Composition declares which definitions the view may render. Composition starts no element work until the Mount appears in the view. Its included handler Layer builds at application startup. See [Mount requirements in reusable views](/core/mount#mount-requirements-in-reusable-views) for attribute and child-view composition.
