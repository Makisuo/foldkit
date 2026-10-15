# Foldkit Architecture Guide

> **Note:** This file is a snapshot of the architecture as practiced in the live Foldkit codebase. If anything here contradicts what `repos/foldkit/examples/` or `repos/foldkit/packages/foldkit/src/` actually do, the live code is canonical. The duplication is intentional so the skill works in downstream projects that haven't vendored the foldkit subtree.

## The TEA Loop

Every Foldkit app follows The Elm Architecture (TEA). A Message arrives. The user clicked a button, a timer fired, an HTTP response came back. The update function receives the current Model and the Message and returns a new Model along with any Commands to execute. The view function renders the new Model as HTML. When the user interacts with the view, it produces another Message, and the loop continues.

The complete cycle, including Mounts, Subscriptions, and ManagedResources:

```
          +------------------------------------------------------+
          |                                                      |
          ↓                                                      |
       Message                                                   |
          |                                                      |
          ↓                                                      |
  +---------------+                                              |
  |    update     |                                              |
  +-------+-------+                                              |
  ↓               ↓                                              |
Model    Command<Message>[]                                      |
  |               |                                              |
  |               +-> Runtime -----------------------------------+
  |                                                              |
  +-> view -> Browser -> user events ----------------------------+
  |       +-> Mounts -> Runtime ---------------------------------+
  |                                                              |
  +-> Subscriptions -> Stream<Message> -> Runtime ----------------+
  |                                                              |
  +-> ManagedResources -> lifecycle -----------------------------+
```

Effects that emit Messages feed them back into update. Commands are one-shot effects. Mounts perform work while a rendered element exists and report at least one Message. Subscriptions manage a Stream whose emissions can become Messages; a `Stream<never>` Subscription can instead maintain scoped work without dispatching. ManagedResources dispatch Messages when they're acquired, released, or fail to acquire. The Browser sends Messages when the user interacts with the DOM.

There are no escape hatches:

- **Model** is the single source of truth: an Effect Schema struct
- **Messages** are facts about what happened: past-tense, never imperative
- **update** is a pure function. It receives the current Model and a Message, then returns an `Update.Return<Model, Message>`
- **view** is a pure function: `(model, h) → Html`, where `h` is the builder the runtime supplies
- **Side effects** stay outside update and view. The Runtime performs Commands and manages Mount, Subscription, and ManagedResource lifecycles. Each reports results through Messages

## Core Invariants

### 1. update is Pure

The update function must be deterministic. Given the same Model and Message, it must always return the same result. This means:

- No `Date.now()`, `Math.random()`, or any non-deterministic call
- No DOM access (`document.*`, `window.*`)
- No `console.log` or other I/O
- No `Effect.runSync` / `Effect.runPromise`
- No `async` / `await`
- No mutation of any kind

These operations belong in Commands, which return their results as Messages.

### 2. view is Pure

The view function takes the Model and the builder `h`, and returns Html. It must not:

- Access external state
- Perform side effects
- Close over mutable variables
- Call functions with side effects

Event handlers in the view dispatch Messages. They don't perform actions directly.

### 3. Expected Command Failures Become Messages

Define Command identities with the named feature’s `command`, whose config declares `args` (optional), every result Message in `messages`, optional interruption behavior, and `handler`. The handler is a generator constructor; Foldkit applies `Effect.gen` internally. Service lookups in that generator run once while the application Layer is built. The returned invocation function runs afresh for every Command with its current args. Definitions omit `execute`. Compose `Fetch.layer` directly in the owning module's `EffectsLayer`. A constructor with no service lookup still uses `function* ()` and returns the invocation function directly. Convert expected failures to Messages with `Effect.catch(() => Effect.succeed(Message.FailedX(...)))` so update can handle them as facts. Defects may still terminate the Effect and follow the runtime's crash path. Omit `handler` only for a contract whose implementation belongs to an external host; that definition has no `.layer` and the host passes its implementation constructor Effect to `toLayer`.

Always assign definitions to PascalCase constants. Never define a Command inline in a pipe chain. Definitions live in the feature whose update produces them, alongside update or in a feature-local `command.ts`. Create a standalone `<CommandName>Layer` binding only when that individual provider is intentionally public or independently reused outside `EffectsLayer` assembly. Let TypeScript infer Command return types. The `messages` array constrains the handler's return type at the type level.

For the canonical shapes, study the live examples directly. They stay synced with the API:

- **With args, fallible** (HTTP fetch): `repos/foldkit/examples/weather/src/command.ts` (`FetchWeather`)
- **With args, infallible** (random + return): `repos/foldkit/examples/kanban/src/command.ts` (`GenerateCardId`)
- **With args, storage**: `repos/foldkit/examples/kanban/src/command.ts` (`SaveBoard`)
- **Argless, DOM side effect**: `repos/foldkit/examples/kanban/src/command.ts` (`FocusAddCardInput`)

### 4. Model Encodes All Possible States

Use discriminated unions to make impossible states unrepresentable:

```ts
// WRONG: boolean flags allow impossible combinations
const Model = Schema.Struct({
  isLoading: Schema.Boolean,
  isError: Schema.Boolean,
  data: Schema.Option(Data),
  error: Schema.Option(Schema.String),
})

// RIGHT: each state is a distinct variant
const DataState = defineTaggedUnion({
  Idle: {},
  Loading: {},
  Error: { error: Schema.String },
  Ok: { data: Data },
})

const Model = Schema.Struct({
  dataState: DataState,
})
```

With booleans, you can have `isLoading: true` AND `isError: true`, an impossible state. With unions, you're always in exactly one state.

For **remote data specifically**, don't hand-roll the union. The `AsyncData` module ships it:

```ts
import { AsyncData } from 'foldkit'

const WeatherAsyncData = AsyncData.Schema(WeatherData, Schema.String)

const Model = Schema.Struct({
  weather: WeatherAsyncData.schema,
})
```

That gives six states, not four: `Idle`, `Loading`, `Refreshing`, `Failure`, `Stale`, `Success`. The two extra ones are the reason to use it. `Refreshing` carries the previous data while a reload runs, so a refetch doesn't blank the screen. `Stale` carries both the previous data and the new error, so a failed reload doesn't discard what the user was reading. A hand-rolled `Idle | Loading | Error | Ok` forces both of those regressions.

The module also supplies the operations: `AsyncData.match`, `matchData`, `isPending`, `hasData`, `getData`, `map`, `revalidate`, `revalidateOrLoad`, `loadIfMissing`, `zipWith`, `all`.

`match` hands each branch the bare value rather than the tagged variant, with one exception:

```ts
AsyncData.match(model.notes, {
  onIdle: () => h.empty,
  onLoading: () => spinnerView,
  onRefreshing: data => listView(data),
  onFailure: error => errorView(error),
  onStale: ({ error, data }) => staleView(error, data),
  onSuccess: data => listView(data),
})
```

`onRefreshing`, `onFailure`, and `onSuccess` each take one bare value. `onStale` takes `{ error, data }` because it carries both. `onIdle` and `onLoading` take nothing at all, since there is no payload in those states. Destructuring `({ data })` in `onSuccess` or `onRefreshing` is the easy mistake. Read `foldkit/asyncData`'s `public.d.ts` for the full surface. `repos/foldkit/examples/weather/src/definition.ts` declares the AsyncData contract; its `application.ts` demonstrates state transitions.

### 5. Messages Are Facts, Not Commands

Messages describe what happened, not what should happen. The update function decides what to do. Messages don't dictate the response:

```ts
// WRONG: imperative, tells the system what to do
const Message = defineMessageUnion({
  FetchData: {},
  SetFilter: { filter: Schema.String },
  ShowModal: {},
})

// RIGHT: past-tense, describes what happened
const Message = defineMessageUnion({
  ClickedRefresh: {},
  SelectedFilter: { filter: Schema.String },
  ClickedOpenModal: {},
})
```

## Update Return Types

`foldkit/update` names the shape so you don't have to:

```ts
import { Update } from 'foldkit'

const update = Feature.update((model, message) =>
  Message.match(message, {
    // ...
  }),
)
```

`Feature.update` preserves the handler requirements of Commands returned by every Message branch while supplying the Block's Model, Message, and OutMessage context. Use it for every Block update.

`Update.ReturnWithOutMessage<Model, Message, OutMessage>` is the Block counterpart, adding an optional `outMessage` field.

Update, init, boot, and component helper producers return `{ model }` when they statically create no Commands. When they compute a Commands collection, they return it directly without checking whether it is empty. Never write the literal `commands: []`.

Inside `Feature.update`, let the outer helper infer the Command requirement channel through `Message.match(message, handlers)`. An explicit `Message.match<Update.Return<Model, Message>>` fixes that channel to `never` and discards the handler requirements the application must provide. When helpers or other matchers need a reusable return alias and any branch returns Commands, include the relevant requirements. Derive them with `Update.RequirementsOf<typeof update>` when the update contract is available, rather than from `EffectsLayer`, which may also contain lifecycle handlers that update never returns. Do not repeat the alias on the update function when the match already constrains its branches.

Use `Update.Return<Model, Message>` for an update that cannot emit an OutMessage. It prevents a result containing an OutMessage from entering code that would keep only its Model and Commands. A result with no `outMessage` can still be used where `Update.ReturnWithOutMessage<Model, Message, OutMessage>` is expected. The missing field means that update emitted no OutMessage. A hand-written plain-return type must preserve the `outMessage?: never` field.

When composing another update-shaped result, bind the whole result to a value named after the operation and access its fields through that value. Use `homeInit`, `dialogClose`, or a trailing underscore such as `init_` when the operation name collides with the function. Do not destructure or rename `model`, `commands`, or `outMessage`. Dot access does not prevent someone from ignoring `outMessage`; it keeps the operation and all of its returned fields visible together. Name a child fold's `write` parameter after the next child Model, such as `nextSettings`.

Pass optional Commands directly to APIs that accept them, such as `Command.mapMessages(homeInit.commands, toParentMessage)`. Use `result.commands ?? []` only when the next operation requires a concrete array for spreading, concatenating, execution, or an assertion.

Use `Update.combine` when a later Step should receive the Model produced by an earlier Step. It takes two or more Steps. Do not wrap one Step in `Update.combine`; call that operation directly. Name an inline Step parameter `stepModel` when combining several; it receives the Model from the preceding Step. Child composition goes through a registered Binding: `binding.init`, `binding.fold`, and `binding.name(...)`.

When the OutMessage is already known while constructing a new result, include it directly: `{ model, commands, outMessage }`. Use `Update.withOutMessage` when attaching an OutMessage to an existing plain return or when the value has the type `OutMessage | undefined`. Pipe an existing return into the helper: `pipe(dialogClose, Update.withOutMessage(outMessage))`. When constructing the plain return in the same expression, pass it first: `Update.withOutMessage({ model, commands }, outMessage)`. Add `outMessage.forward` only when at least one child OutMessage should continue to the current Block's parent. For partial forwarding, match every child variant and return `undefined` for the variants that stop here. Omit `outMessage.forward` when every variant stops here. `outMessage.fold` still handles each variant locally, including variants that continue upward. Never add `outMessage.forward: () => undefined` only to change the fold's return type.

A child Binding handles local OutMessages through `outMessage.fold`. Add `outMessage.forward` only for variants that continue upward. A derived parent OutMessage takes precedence over direct forwarding for that dispatch.

The module also carries two combinators for handlers that fan out after a mutation succeeds:

- `Update.combine(model, [step, step, ...])` sequences update steps over one Model, threading the Model through and collecting the Commands.
- `Update.refresh({ read, revalidate, write, load })` builds a step that reloads a cache **only when it already holds data**. When a cache is `Idle`, the step returns `{ model }` and does not load it. A `Succeeded*` handler can therefore list every possibly affected cache without fetching caches nobody has opened.

```ts
SucceededUpdateNote: ({ note }) =>
  Update.combine(model, [
    replaceNoteInCaches(note),
    refreshNote(note.id),
    refreshAllNotes,
    showToast('Success', `Updated ${note.title}`),
  ])
```

`repos/foldkit/examples/route-transitions/src/application.ts` uses both.

## Flags: Side Effects That Seed the Initial Model

When the initial Model needs data from a side effect (current time, localStorage, browser APIs), use Flags, not module-level constants:

```ts
// WRONG: module-level side effect (non-deterministic and untestable)
const now = Date.now()
const init = () => ({ model: { createdAt: now } })

// RIGHT: Flags run as an Effect before init, result passed in
const Flags = Schema.Struct({
  createdAt: Schema.Number,
})

const flags = Effect.gen(function* () {
  const now = yield* Clock.currentTimeMillis
  return Flags({ createdAt: now })
})

const init = (flags: Flags) => ({
  model: Model({ createdAt: flags.createdAt }),
})
```

For a fresh browser boot, Flags are produced by an `Effect<Flags>`. The runtime executes it once before init and passes the result in. This keeps init pure while still allowing side effects to populate the initial Model. Common uses:

- Reading from localStorage/sessionStorage (restoring saved state)
- Getting the current time
- Reading browser capabilities (`navigator.language`, `matchMedia`)

When Flags restore a value that a Command saved to storage, define the persistence Schema once next to the saved Schema and use it for both decode and encode:

```ts
export const SavedBoardJsonString = Schema.fromJsonString(
  Schema.toCodecJson(SavedBoard),
)
```

`toCodecJson` turns the domain value into canonical JSON, then `fromJsonString` stringifies it. Leave it out and a field like `Schema.Option` writes Effect's runtime shape (`{_id:"Option",_tag:"None"}`) to storage. The next boot fails to decode it, the Flags `Effect.catch` falls back to the empty value, and the user's saved data looks gone. For a Schema that is already JSON-native, `toCodecJson` changes nothing on the wire, so composing it every time costs nothing.

Import `defineApplication` from `foldkit`. Declare the root Model and Message through `Application`, establish the root graph as `ApplicationComposition`, declare the `Flags` Schema in its `toApplication` config, then pass the runtime input to `Runtime.run`:

```ts
import { defineApplication } from 'foldkit'

const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition({ children })

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
})

Runtime.run(application.provide(ApplicationLayer), { flags })
```

Hydrated applications do not provide a browser Flags Effect. `Runtime.hydrate(application)` decodes the exact Schema-encoded Flags payload emitted by the server. `@foldkit/vite-plugin` compiles the shared deployment identity into Foldkit for coordinated client and server builds; separately orchestrated builds pass the same explicit `buildId` override to each artifact. Hydration compares that identity against the id the server stamped on the root before it reads the handoff at all. Missing or invalid server handoff data, and a page from another deployment, are fatal boot errors.

Leave a Flags service in the Effect requirements when the application root should choose or share its provider. Keep a service used by both Flags and handlers exposed from `ApplicationLayer` with `Layer.provideMerge`. A service may be private to `flags` only when startup deliberately owns it and no application environment needs to substitute or share it. The Runtime builds the resulting Layer eagerly on every start, before executing a fresh Flags Effect, init, or the first render, including a start that restores a preserved Model. `Runtime.hydrate` validates the server handoff before acquiring Layers. A construction failure stops startup before the first render. Do not also provide a root service inside `flags`: doing both builds it twice and hands the app two instances of whatever it holds.

An Element owns its Flags Effect because no separate runtime call seeds it. Put both `Flags` and `flags` in the `ApplicationComposition.toElement` config. The embedded widget example later in this guide shows the full shape.

## Layers

Commands, Subscriptions, Mounts, and ManagedResources contribute handler recipes to their completed Block. Child Bindings qualify those recipes by placement, and the Application Composition carries the complete handler graph into its `toApplication` or `toElement` method. The completed `application` or `element` supplies the ordinary Services those recipes still require through its `provide` method. That method returns a new passive program; the assembly config has no `resources` field. Every application Layer is built once for each runtime start and released when that runtime stops.

Each handler requirement carries its primitive, locally declared name, and exact protocol. Binding composition derives the application identity from the owner and placement path, so reusable children can keep stable local names without coordinating full parent paths. Composition rejects incompatible contracts before Runtime start. Prefer `Command.HandlerOf<typeof Definition>`, `Subscription.HandlerOf<typeof subscriptions.entry>`, `Mount.RequirementsOf<typeof Definition>`, and `ManagedResource.HandlerOf<typeof managedResources.entry>` only when an explicit local annotation is useful; normal definitions, owned views, and update functions infer them.

Compose Layers at the same boundaries as Model and Message ownership. Keep a small local `EffectsLayer` with completion in `block.ts`; extract `layer.ts` only when the local composition is substantial or reused. The completed Block collects the handler graphs of child Bindings included in the Composition. Import Effect's module as `Layer` without an alias:

```ts
export const EffectsLayer = Layer.mergeAll(
  FetchResults.layer,
  subscriptions.searchEvents.layer,
)
```

Pass this local recipe to `FeatureComposition.toBlock(...)`; `Feature.toComposition({ children, mounts })` supplies the graph. Export the completed value as `block`. At a compact root, `application.ts` defines `Application` and produces `ApplicationComposition`. When substantial split root modules need the authoring value, `definition.ts` may own only that early contract; `application.ts` imports and intentionally re-exports `Application`, then exports `ApplicationComposition`. `entry.ts` imports each completion field from its real owner, chooses host inputs, and calls owned completion:

```ts
import { Runtime } from 'foldkit'
import { ApplicationComposition } from './application'
import { ApplicationLayer } from './services'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
```

Keep root `ApplicationLayer` composition in `services.ts`; `entry.ts` imports it and starts the completed application. Tests and server entries import the passive Composition and implementation pieces without selecting a browser container or starting the Runtime. `ApplicationLayer` supplies the ordinary Services still required by the completed application.

If an owning module's handler Layers need a business service defined by that module, provide it beneath that module's `EffectsLayer`. Leave concrete HTTP, storage, RPC, and browser requirements open for the application root. The root chooses those providers and uses `Layer.provideMerge` when their outputs must remain available to Flags or another application consumer. Keep handler-by-handler imports out of the entry point. Calls such as `application.provide(firstLayer).provide(secondLayer)` can be chained when one Layer leaves requirements for a later Layer, but a composed `ApplicationLayer` keeps ordinary application wiring at module granularity.

Setting `config.handler` creates the definition's `.layer` recipe; it does not build the Layer. The Runtime builds the application Layer once for each start. The handler generator runs once during that build, performs its service lookups, and returns the function used later. Every Command invocation, Subscription scope, Mount element, or ManagedResource acquisition calls that function with fresh input while reusing the captured services. Looking up a service retrieves an instance from the Effect context; it does not construct the provider. Scope finalizers registered while building the Layer run when that runtime stops.

Every attached implementation is `config.handler`, a generator constructor. Use `function* ()` to capture services and return the invocation function; Foldkit applies `Effect.gen`. A constructor that yields nothing keeps the same shape: `handler: function* () { return args => effect }`. Each invocation receives the current Command args, Subscription dependencies, Mount element, or ManagedResource requirements.

Omit `handler` only at an external host boundary. The definition then has `toLayer` but no `.layer`, and the host supplies the constructor Effect:

```ts
import { Context, Effect } from 'effect'

import { Feature } from './definition'
import { Message } from './message'

type HostApi = Readonly<{
  requestToken: Effect.Effect<string>
}>

const HostApi = Context.Service<HostApi>('HostApi')

export const RequestHostToken = Feature.command('RequestHostToken', {
  messages: [Message.CompletedRequestHostToken],
})

const RequestHostTokenLayer = RequestHostToken.toLayer(
  Effect.gen(function* () {
    const host = yield* HostApi

    return () =>
      host.requestToken.pipe(
        Effect.map(token => Message.CompletedRequestHostToken({ token })),
      )
  }),
)
```

The host selects a completed feature recipe containing `RequestHostTokenLayer` before binding that feature. `ApplicationLayer` still provides only ordinary Services required by the selected recipe. Subscription, Mount, ManagedResource, and experimental Query host contracts use the same boundary: `toLayer` receives the constructor Effect that returns the complete implementation.

Keep four lifetimes distinct. Application services such as RPC clients last for one Runtime start. A Command Effect lasts for one dispatch. Subscription Streams and ManagedResource handles follow Model conditions. Mount acquisition follows one DOM element. Do not capture current time, Command args, Subscription dependencies, a DOM element, or an active ManagedResource handle in an application-scoped constructor.

Handlers and services may own mutable execution bookkeeping, such as worker availability or protocol request IDs. The Model and update own pending work shown to the user, selections, and submission rules. A `Ref` created in the constructor must not become the source of truth for workflow decisions or state read by view.

Whole-application execution tests compose the same handler Layers with deterministic providers for external services before building the application Layer. Keep any business service Layer whose decoding, retries, or policy the test should cover, and replace its lower HTTP or RPC transport. That keeps Command result mapping, Subscription Stream transformation, Mount element lifecycle, and ManagedResource acquire and release behavior under test. Replacing a complete handler is a narrower way to orchestrate a result path, and does not test the replaced handler. Use Effect Layers directly for substitution rather than introducing a testing DSL.

The implementation Layer graph does not replace the Composition graph. A completed child Block collects `subscriptions`, `managedResources`, and `mounts` through the same Bindings that supply handler Layers. Root `application.ts` creates `Application` with `defineApplication` and exports `ApplicationComposition` from `toComposition`. The entry imports that Composition and the implementation fields from their actual owners, chooses the container, and calls `toApplication` or `toElement` with explicit fields. It provides `ApplicationLayer` to the completed program and starts the Runtime.

## Mounts

Use a Mount when work follows one rendered element and needs that live `Element`. For example, measuring a panel belongs in a Mount because `getBoundingClientRect()` must read the actual DOM node after insertion:

```ts
export const MeasurePanel = Feature.mount('MeasurePanel', {
  messages: [Message.CompletedMeasurePanel],
  handler: function* () {
    return ({ element }) =>
      Effect.sync(() =>
        Message.CompletedMeasurePanel({
          height: element.getBoundingClientRect().height,
        }),
      )
  },
})

export const mounts = [MeasurePanel]
export const EffectsLayer = MeasurePanel.layer
```

The view uses `h.OnMount(MeasurePanel())`. Put the Mount in `Feature.toComposition({ mounts })` and author the canonical view through that Composition; its builder receives the capability automatically. Immediately after the Composition, declare `type FeatureViewBuilder = Block.HtmlBuilderOf<typeof FeatureComposition>` for ordinary feature-local helpers on the same mounted or child embedding path. Export it only when another file uses it. Give each helper only its meaningful Model, domain, or context parameters plus `h: FeatureViewBuilder`. Reusable helpers independent of one owner keep the general `HtmlBuilder<Message>`. Use `Feature.mountStream` when the element supplies an ongoing event Stream; keep listener or observer acquisition and cleanup inside the returned Stream so each element owns its own scope.

The owner-specific `FeatureViewBuilder` alias preserves its Composition's Message, child, and Mount evidence and creates no runtime value. Its owner prefix is the exception to the standard `Model`, `Message`, and `OutMessage` names because a plain builder type import must identify the Composition whose capabilities it carries. Reusable helpers retain the framework's general `HtmlBuilder<Message>`.

Complete each feature with its local Subscription registry. Include its parent-owned Binding in the parent Composition's `children`; composition collects child records and preserves their Message contracts automatically. Parent Subscription activation belongs in the Binding's `subscriptions.when` policy.

## The Block Pattern

A Block gives one feature its own Model, Message, update, lifecycle graph, view, and optional OutMessage. Every Block follows the same passive stages:

```ts
const Child = Block.define('Child', {
  Model,
  Message,
  OutMessage,
})

const ChildComposition = Child.toComposition({
  children,
  mounts,
})

export const block = ChildComposition.toBlock({
  init,
  update,
  view,
  expose: { refresh },
  subscriptions,
  managedResources,
  EffectsLayer,
})
```

Definition establishes contracts and authors behavior. The named Composition fixes child Bindings and Mount capabilities and authors the primary view. Block completion uses that same Composition to check the implementation and handler graph. `children` and `mounts` are independently optional, so a pure feature still creates `const ChildComposition = Child.toComposition()` before authoring its view and calling `ChildComposition.toBlock(...)`. Use the name-only `Block.define('Combobox')` form only for a generic factory that shares definitions before specializing contracts with `.define(...)`.

Split features keep early contracts in `definition.ts`; `composition.ts` owns Bindings, the complete children/Mount registration, the Composition and optional owner-specific ViewBuilder alias. Mount-only features use the same home; shared Mount definitions belong in `mount.ts`, imported by both Composition and view. Substantial policy may move to `composition/<child>.ts`; then `composition/composition.ts` is the single assembly point and `composition/index.ts` is an explicit barrel. A split graphless feature exports its named empty Composition beside the Definition in `definition.ts`; view and `block.ts` import that same value. A compact graphless feature keeps it beside its cohesive implementation. Root `application.ts` owns the full root graph and imports substantial root policies directly. Do not add a childBindings file, duplicate children list, arbitrary Binding categories, or a root composition wrapper. Cohesive generic factories can retain local assembly. Keep substantive behavior in focused files or a folder-named implementation, and complete the feature in `block.ts`. Composition must not import the primary view, update matcher or completed Block. Put policy-dependent pure Steps in leaf modules when needed. Explicit barrels export the completed `block`, contracts and intended domain helpers. Import an extracted Binding policy as a namespace such as `HomeBinding` when using several related exports, so its factory or Binding and parent-owned Commands remain visibly grouped. Keep named imports for a single Binding or helper. Keep child feature namespaces distinct from parent-owned Binding policies.

Declare only intentional parent-driven operations in `expose`. Bindings expose them directly as parent Steps. Forward received child Messages through `binding.fold(model, message)`; do not manufacture child Messages to initiate changes. Select an alternate local handler bundle with `block.replaceEffectsLayer(...)` before binding. A host completes entries listed in `hostHandlers` with `block.provideHandlers(...)` before binding.

### Communication

The parent owns child integration. Create a Binding from the parent Definition, then register it in the parent Composition:

```ts
export const Parent = Block.define('Parent', { Model, Message })

const foldChildOutMessage = Child.OutMessage.match({
  SucceededCreateRoom: ({ roomId }) => openRoom(roomId),
})

export const child = Parent.bindChild(Child.block, {
  field: 'maybeChild',
  presentWhen: model =>
    ApplicationRoute.match(model.route, {
      Child: () => true,
      Other: () => false,
    }),
  parentMessage: Message.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})

export const ParentComposition = Parent.toComposition({
  children: [child],
})
```

Use `{ field, parentMessage }` for an exact Struct field containing `ChildModel` or `Option<ChildModel>`. A direct Option field stays absent while `None`; `presentWhen` adds whole-child policy to the direct form. Use explicit `read` and `write` for tagged, nested, or custom storage. A direct array of child Models with declared Struct key fields uses string-valued `field` and `key` with two-argument `toParentMessage`. A required `Schema.Array` field on a parent Struct containing closed wrappers adds a distinct string-valued `childField`; its required wrapper key is a string or finite number, while its required child field has exactly the same decoded shape as the child Model. The generated writer replaces only the matched child field, preserving wrapper metadata, array order, and unmatched references without inserting a removed wrapper. Both array forms default placement to `field`. Union, suspended, and other opaque direct child Schemas, opaque, union, or open/index-signature wrappers, custom writes, and zero-or-one `Option<RoomInstance>` collections use the general keyed form with `readAll`, function-valued `key`, `read`, `writeAt`, and `toParentMessage`. Each key keeps independent lifecycle identity while the parent owns collection reconciliation.

The parent configures OutMessage policy in the Binding. That policy executes during the pure child fold or exposed operation:

parent update → child fold or operation → parent OutMessage handling → parent result

`outMessage.fold` handles a variant locally. `outMessage.forward` sends selected variants through the current Block's OutMessage. A derived OutMessage takes precedence over forwarding for the same dispatch, while local handling still runs. Preserve `FoldContext.liftCommand`, collection keys, and previous Model context when a policy uses them.

The Binding carries Command scoping, Message lifting, handler requirements, placement identity, and registration evidence. Optional absence and keyed removal also drive lifecycle cleanup and stale callback suppression at runtime. TypeScript checks contracts and registration capabilities; runtime generation checks protect asynchronous results after an occurrence disappears.

### View Delegation

Author the canonical completed view through `ParentComposition.view` or `view.withInputs` and let the primary view's builder parameter infer. Ordinary parent-local helpers are plain functions whose builder parameter uses `type ParentViewBuilder = Block.HtmlBuilderOf<typeof ParentComposition>`, declared immediately after the Composition. Give each helper only the Model, domain value, or context it uses. Plain reusable helpers remain generic over the caller's general `HtmlBuilder`.

Embed the child through the same Binding:

```ts
export const view = ParentComposition.view((model, h) =>
  Option.match(model.maybeChild, {
    onNone: () => h.empty,
    onSome: childModel =>
      h.block(child.embedView({ slotId: 'child', model: childModel })),
  }),
)
```

The runtime resolves the Message wrapper at event time. Child builders dispatch child Messages; parent-built callbacks supplied through view inputs retain parent dispatch scope.

## Subscriptions

Subscriptions are model-driven streams. They automatically start and stop based on model state.

Build them with `Feature.subscriptions(entry => ({ ... }))`. Use the Layer-backed `entry(handlerName, fields, callbacks)` form when its lifetime depends on the Model. For those Subscriptions, provide:

- A stable handler name. Distinct definitions in one application need distinct names even when their record keys differ.
- A `fields` map (the bare field map passed as `entry`'s second argument) naming every dependency. The builder calls `Schema.Struct(fields)` internally and infers the dependency type from this map.
- A `messages` collection in `callbacks` listing the exact Message Schemas the attached handler or external `toLayer` Stream can emit. Use `messages: []` when the scoped Stream emits no Messages; that declaration requires `Stream<never>`. Scene uses the Schemas to validate both the selected `Subscription.emit` source and its Message before applying parent mappings.
- A `modelToDependencies(model)` function that returns the parameters the stream needs. Wrap an absent dependency in `Option` at the field level. The runtime restarts the stream whenever the dependencies change.
- A `handler: function* () { return dependencies => stream }` field. Errors should be mapped to a `Failed*` Message inside the stream rather than thrown. Compose `subscriptions.key.layer` directly in the owning module's `EffectsLayer`.

Name the handler for the events or scoped behavior the entry supplies, such as `KeyboardPresses`, `SystemThemeChanges`, or `GameClockTicks`. The handler name identifies the Layer requirement. Keep the record key parallel, such as `keyboardPresses`, `systemThemeChanges`, or `gameClockTicks`; the key identifies the runtime registration and Stream scope. Several lifted registrations can share one definition and handler Layer while retaining distinct keys. The Model dependencies determine when its scope is active. Avoid generic `Watch*` names that identify only the input source. Compose the entry's attached recipe directly in `EffectsLayer`; create a standalone binding such as `KeyboardPressesLayer` only when that individual provider is intentionally public or independently reused outside `EffectsLayer` assembly. Subscription lifecycle entries in DevTools are follow-up work.

For Layer-backed Subscriptions without local Model dependencies (keyboard listeners, window resize, animation frame ticks), pass the stable handler name, Message Schemas, and `handler: function* () { return () => stream }`. Use the cold `Dom.animationFrameTicks` Stream for animation frame ticks. The Subscription then stays active across local Model updates. Its parent can still gate it when lifted.

A silent Subscription can own scoped DOM state. Keep acquisition and cleanup inside the `Stream<never>` so dependency changes and runtime shutdown remove the owned style:

```ts
const subscriptions = Feature.subscriptions(entry => ({
  dragSelectionStyles: entry(
    'DragSelectionStyles',
    { isDragging: Schema.Boolean },
    {
      messages: [],
      modelToDependencies: model => ({ isDragging: model.isDragging }),
      handler: function* () {
        return ({ isDragging }) =>
          Stream.when(
            Stream.fromEffect(
              Effect.acquireRelease(
                Effect.sync(() => {
                  const styleElement = document.createElement('style')
                  styleElement.textContent =
                    ':root { user-select: none !important; }'
                  document.head.appendChild(styleElement)
                  return styleElement
                }),
                styleElement => Effect.sync(() => styleElement.remove()),
              ).pipe(Effect.flatMap(() => Effect.never)),
            ),
            Effect.sync(() => isDragging),
          )
      },
    },
  ),
}))
```

Canonical live examples:

- **Always-active keyboard input**: `repos/foldkit/examples/snake/src/application.ts`
- **Animation-frame-driven game tick**: `repos/foldkit/examples/canvas-art/src/application.ts`
- **Conditional WebSocket connection** (active only when a session exists): `repos/foldkit/examples/websocket-chat/src/application.ts`
- **Production multi-stream pattern**: `repos/foldkit/packages/typing-game/client/src/page/room/subscription.ts`

## View Identity and Keys

View functions are the differ's identity boundaries. `@foldkit/vite-plugin` brands every view function's return with that function's identity, so switching between branches that render through different view functions replaces the old subtree instead of patching it, even when both branch roots share a tag. Branches are never keyed. `if`/`else`, ternaries, Effect `Match`, and `switch` all behave the same way: each arm's view function carries its own identity, and continuity is structural.

Extract the arms into named view functions when a same-tag inline ternary must reset DOM state on switch. An inline `cond ? div(...) : div(...)` renders both arms through the enclosing function, so they share one identity and patch in place; two named functions give each arm its own identity.

Write keys in exactly two places:

- **Mapped list items**, keyed by a stable Model id, never by array position. Rows rendered by one row view function all share that function's identity, so the key is what distinguishes them.
- **A shared view function rendering different entities at one position** (a detail page across slugs or ids), keyed by the entity id, so switching entities resets DOM state instead of bleeding it across.

```ts
// Mapped list: key each row by its stable Model id
Array.map(model.items, item => keyed('li')(item.id, [...], [...]))

// Shared view function across entities: key by the entity id
keyed('article')(model.selectedProduct.id, [...], [...])
```

Keys carry identity, never data. A key answers which item or entity occupies a position, not what it currently shows. Never derive a key from displayed data to force a refresh when content changes:

```ts
// Wrong: the key restates displayed data, so every toggle tears the
// panel down, discarding focus, scroll, and any open details element
keyed('div')(`${model.isCardSelected}:${model.isTermsAccepted}`, [...], [...])

// Right: same thing on every render, no key; changed content patches in place
div([...], [...])
```

If a key can change while the same conceptual thing stays on screen, the key is doing change detection, and patching already does that. Always build with `@foldkit/vite-plugin`; without it, branch identity falls back to positional-plus-key semantics and every branch point needs a hand-written key.

## DOM and Effect Helpers

DOM operations and browser Streams use Foldkit's `Dom` module. Time, randomness, and delays use Effect's built-in services. The Effects compose in Commands, while the Streams compose in Subscriptions and Mounts.

### Foldkit `Dom` module

Import as `import { Dom } from 'foldkit'` (or `import * as Dom from 'foldkit/dom'`).

| Helper                             | What it does                                                 |
| ---------------------------------- | ------------------------------------------------------------ |
| `Dom.focus(selector)`              | Focus a DOM element by CSS selector                          |
| `Dom.advanceFocus(direction)`      | Move focus to the next/previous focusable element            |
| `Dom.scrollIntoView(selector)`     | Scroll an element into view                                  |
| `Dom.showDialog(selector)`         | Open a `<dialog>` element with `show()`                      |
| `Dom.closeDialog(selector)`        | Close a `<dialog>` element                                   |
| `Dom.clickElement(selector)`       | Programmatically click an element                            |
| `Dom.lockScroll` / `unlockScroll`  | Prevent / restore page scroll (e.g. behind modals)           |
| `Dom.inertOthers` / `restoreInert` | Toggle `inert` on siblings of an element (focus containment) |
| `Dom.detectElementMovement(...)`   | Observe an element for layout-affecting movement             |
| `Dom.waitForAnimationSettled(sel)` | Wait for CSS animations/transitions on an element to finish  |
| `Dom.animationFrameTicks`          | Stream elapsed milliseconds for each browser animation frame |

### Effect built-ins

Use these directly from the `effect` package for non-DOM concerns. No Foldkit wrapper is needed.

| Need                  | Use                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Current time (millis) | `yield* Clock.currentTimeMillis`                                                                                                              |
| Current calendar date | `yield* Calendar.today.local` (returns `CalendarDate`)                                                                                        |
| Random integer        | `yield* Random.nextIntBetween(min, max)`                                                                                                      |
| Random float          | `yield* Random.nextBetween(min, max)`                                                                                                         |
| UUID                  | `yield* Effect.orDie(crypto.randomUUIDv4)` after `const crypto = yield* Crypto.Crypto`; provide `BrowserCrypto.layer` at the application root |
| Delay                 | `yield* Effect.sleep(Duration.millis(500))`                                                                                                   |

Use these instead of raw `document.querySelector`, `setTimeout`, `Date.now()`, or `Math.random()`. They compose naturally inside a Command's attached handler. For canonical wiring, see `repos/foldkit/examples/kanban/src/command.ts` (`FocusAddCardInput` wraps `Dom.focus`, `GenerateCardId` requires `Crypto.Crypto`), `repos/foldkit/examples/kanban/src/services.ts` (the root composes `BrowserCrypto.layer`), and `repos/foldkit/examples/kanban/src/entry.ts` (the entry supplies `ApplicationLayer`). `repos/foldkit/examples/stopwatch/src/application.ts` shows `Clock.currentTimeMillis` inside an `Effect.gen`.

## With and Without URL Routing

`const Application = defineApplication({ Model, Message })` establishes root contracts. Every root then creates `ApplicationComposition = Application.toComposition({ children?, mounts? })`; use `toComposition()` for a graphless app. Complete only the Composition, with explicit implementation fields.

### Without Routing

```ts
import { defineApplication } from 'foldkit'

const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition()

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
```

### With Routing

A routing init receives Flags, when declared, and the current URL. Add both Message constructors to `routing`:

```ts
const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

const ApplicationComposition = Application.toComposition({
  children: [home],
})

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})
```

### Scoped to a Node (Embedded Widgets)

`ApplicationComposition.toApplication` owns the page and completes a Document view. `ApplicationComposition.toElement` completes a container-scoped Html view and has no routing config:

```ts
const element = ApplicationComposition.toElement({
  init,
  update,
  view,
  container: document.getElementById('widget'),
})

Runtime.run(element.provide(ApplicationLayer))
```

Element Flags live in the `toElement` config. A host factory can turn initial data into a Flags Effect and provide the root Service Layer:

```ts
export const createElement = (container: HTMLElement, flags: Flags) =>
  ApplicationComposition.toElement({
    init,
    update,
    view,
    Flags,
    flags: Effect.succeed(flags),
    container,
  }).provide(ApplicationLayer)
```

Use `Runtime.embed(program)` when the host must mount, dispose, or communicate through Ports. The host never touches the Model. See `repos/foldkit/examples/embedding/` for the complete pattern.

### Document Metadata

With `toApplication`, the `view` returns a `Document`. The runtime writes `title` to `document.title` after every render. It never derives `canonical` from the address bar. Build the canonical from the typed route in the Model, where the application can decide which route and query values identify the page.

If no render supplies `canonical`, the runtime leaves a served `<link rel="canonical">` unchanged or keeps the document without one. Before the client first writes a canonical, it records the existing `href`. A later omission restores that value, or removes the element if the runtime created it. During hydration, the recorded value can be the initial route's server-rendered canonical, so omission means restore that baseline rather than remove every canonical.

`ogUrl` can be supplied independently. An omitted `ogUrl` uses an explicit `canonical`, and its restore or removal behavior is the same. `Server.renderToString` returns only a canonical supplied by the view and gives `ogUrl` the explicit canonical when `ogUrl` is omitted. It does not derive either field from `Request.url`.

With `toElement`, the runtime does not manage the title or document metadata.

`lang` and `dir` sync to the `<html>` element, so an app that switches language at runtime drives them from the Model. `dir` is `TextDirection` from `foldkit/html`, a Schema over `'Ltr' | 'Rtl' | 'Auto'` that you can drop straight into a Model `Schema.Struct`, and the runtime writes it as the lowercase attribute value. Both fields are optional and have no default: when a view omits one, the runtime does not touch that attribute, leaving whatever value it currently holds, so a view that never sets it leaves the served HTML in place.

`onUrlRequest` fires when the user clicks a link. The Message receives a `UrlRequest` (a tagged union from the `Navigation` namespace) which you handle in update by matching on its `_tag`. `onUrlChange` fires when the browser URL changes (back/forward buttons); the handler updates the route from the new URL.

For the canonical update-handler shapes (the exact `UrlRequest` tag names, how to dispatch `pushUrl` vs an external load Command, and how to derive the route from a `Url`), see `repos/foldkit/examples/routing/src/application.ts`.

### How to Choose

- App is a widget embedded on a page it does not own (must not touch the host `<head>`) → `ApplicationComposition.toElement`
- The host application also needs to drive it (lifecycle, data in, values out) → `toElement` started with `Runtime.embed`, communicating through Flags and Ports
- App owns the page and mentions "pages", "navigation", "routes", URLs → `ApplicationComposition.toApplication` with routing config
- App owns the page with no navigation → `ApplicationComposition.toApplication` without routing
