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

- **With args, fallible** (HTTP fetch): `repos/foldkit/examples/weather/src/application.ts` (`FetchWeather`)
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

`onRefreshing`, `onFailure`, and `onSuccess` each take one bare value. `onStale` takes `{ error, data }` because it carries both. `onIdle` and `onLoading` take nothing at all, since there is no payload in those states. Destructuring `({ data })` in `onSuccess` or `onRefreshing` is the easy mistake. Read `foldkit/asyncData`'s `public.d.ts` for the full surface. `repos/foldkit/examples/weather/src/application.ts` is the canonical use.

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

const update = definition.update((model, message) =>
  Message.match(message, {
    // ...
  }),
)
```

`definition.update` preserves the handler requirements of Commands returned by every Message branch while supplying the Block's Model, Message, and OutMessage context. Use it for every Block update.

`Update.ReturnWithOutMessage<Model, Message, OutMessage>` is the Block counterpart, adding an optional `outMessage` field.

Update, init, boot, and component helper producers return `{ model }` when they statically create no Commands. When they compute a Commands collection, they return it directly without checking whether it is empty. Never write the literal `commands: []`.

Inside `definition.update`, let the outer helper infer the Command requirement channel through `Message.match(message, handlers)`. An explicit `Message.match<Update.Return<Model, Message>>` fixes that channel to `never` and discards the handler requirements the application must provide. When helpers or other matchers need a reusable return alias and any branch returns Commands, include the relevant requirements. Derive them with `Update.RequirementsOf<typeof update>` when the update contract is available, rather than from `EffectsLayer`, which may also contain lifecycle handlers that update never returns. Do not repeat the alias on the update function when the match already constrains its branches.

Use `Update.Return<Model, Message>` for an update that cannot emit an OutMessage. It prevents a result containing an OutMessage from entering code that would keep only its Model and Commands. A result with no `outMessage` can still be used where `Update.ReturnWithOutMessage<Model, Message, OutMessage>` is expected. The missing field means that update emitted no OutMessage. A hand-written plain-return type must preserve the `outMessage?: never` field.

When composing another update-shaped result, bind the whole result to a value named after the operation and access its fields through that value. Use `homeInit`, `dialogClose`, or a trailing underscore such as `init_` when the operation name collides with the function. Do not destructure or rename `model`, `commands`, or `outMessage`. Dot access does not prevent someone from ignoring `outMessage`; it keeps the operation and all of its returned fields visible together. Name a child fold's `write` parameter after the next child Model, such as `nextSettings`.

Pass optional Commands directly to APIs that accept them, such as `Command.mapMessages(homeInit.commands, toParentMessage)`. Use `result.commands ?? []` only when the next operation requires a concrete array for spreading, concatenating, execution, or an assertion.

Use `Update.combine` when a later Step should receive the Model produced by an earlier Step. It takes two or more Steps. Do not wrap one Step in `Update.combine`; call that operation directly. Name an inline Step parameter `stepModel` when combining several; it receives the Model from the preceding Step. Child composition goes through a registered connection: `connection.init`, `connection.fold`, and `connection.name(...)`.

When the OutMessage is already known while constructing a new result, include it directly: `{ model, commands, outMessage }`. Use `Update.withOutMessage` when attaching an OutMessage to an existing plain return or when the value has the type `OutMessage | undefined`. Pipe an existing return into the helper: `pipe(dialogClose, Update.withOutMessage(outMessage))`. When constructing the plain return in the same expression, pass it first: `Update.withOutMessage({ model, commands }, outMessage)`. Add `outMessage.forward` only when at least one child OutMessage should continue to the current Block's parent. For partial forwarding, match every child variant and return `undefined` for the variants that stop here. Omit `outMessage.forward` when every variant stops here. `outMessage.fold` still handles each variant locally, including variants that continue upward. Never add `outMessage.forward: () => undefined` only to change the fold's return type.

A child connection handles local OutMessages through `outMessage.fold`. Add `outMessage.forward` only for variants that continue upward. A derived parent OutMessage takes precedence over direct forwarding for that dispatch.

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

Import `define as defineApplication` from `foldkit/application`. Declare the root Model and Message through a typed PascalCase `Application`, register the root graph, declare the `Flags` Schema in the registered composition's `make` config, then pass the Effect to `Runtime.run`:

```ts
import { define as defineApplication } from 'foldkit/application'

const Application = defineApplication({ Model, Message }).register({ children })

const application = Application.make({
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

An Element owns its Flags Effect because no separate runtime call seeds it. Put both `Flags` and `flags` in the registered composition's `makeElement` config. The embedded widget example later in this guide shows the full shape.

## Layers

Commands, Subscriptions, Mounts, and ManagedResources contribute handler recipes to their completed Block. Child connections qualify those recipes by placement, and the registered application composition carries the complete handler graph into its `make` or `makeElement` method. The completed `application` or `element` supplies the ordinary Services those recipes still require through its `provide` method. That method returns a new passive program; the assembly config has no `resources` field. Every application Layer is built once for each runtime start and released when that runtime stops.

Each handler requirement carries its primitive, locally declared name, and exact protocol. Connection composition derives the application identity from the owner and placement path, so reusable children can keep stable local names without coordinating full parent paths. Composition rejects incompatible contracts before Runtime start. Prefer `Command.HandlerOf<typeof Definition>`, `Subscription.HandlerOf<typeof subscriptions.entry>`, `Mount.RequirementsOf<typeof Definition>`, and `ManagedResource.HandlerOf<typeof managedResources.entry>` only when an explicit local annotation is useful; normal definitions, owned views, and update functions infer them.

Compose Layers at the same boundaries as Model and Message ownership. A Block's `layer.ts` imports its local definitions and exports their combined `EffectsLayer`. Its completed value collects registered children's handler graphs. Import Effect's module as `Layer` without an alias:

```ts
export const EffectsLayer = Layer.mergeAll(
  FetchResults.layer,
  subscriptions.searchEvents.layer,
)
```

Pass this local recipe to the feature's `assemble`; its `register({ children, mounts })` stage supplies the graph. Export the completed value as `block`. At the root, `const Application = defineApplication({ Model, Message }).register(...)` establishes the checked composition. Export that definition and the implementation pieces from `application.ts`. `entry.ts` chooses the host inputs and calls owned completion:

```ts
import { Runtime } from 'foldkit'
import { Application, init, update, view, EffectsLayer } from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
```

Tests and server entries import the passive definition and implementation pieces without selecting a browser container or starting the Runtime. `ApplicationLayer` supplies the ordinary Services still required by the completed application.

If an owning module's handler Layers need a business service defined by that module, provide it beneath that module's `EffectsLayer`. Leave concrete HTTP, storage, RPC, and browser requirements open for the application root. The root chooses those providers and uses `Layer.provideMerge` when their outputs must remain available to Flags or another application consumer. Keep handler-by-handler imports out of the entry point. Calls such as `application.provide(firstLayer).provide(secondLayer)` can be chained when one Layer leaves requirements for a later Layer, but a composed `ApplicationLayer` keeps ordinary application wiring at module granularity.

Setting `config.handler` creates the definition's `.layer` recipe; it does not build the Layer. The Runtime builds the application Layer once for each start. The handler generator runs once during that build, performs its service lookups, and returns the function used later. Every Command invocation, Subscription scope, Mount element, or ManagedResource acquisition calls that function with fresh input while reusing the captured services. Looking up a service retrieves an instance from the Effect context; it does not construct the provider. Scope finalizers registered while building the Layer run when that runtime stops.

Every attached implementation is `config.handler`, a generator constructor. Use `function* ()` to capture services and return the invocation function; Foldkit applies `Effect.gen`. A constructor that yields nothing keeps the same shape: `handler: function* () { return args => effect }`. Each invocation receives the current Command args, Subscription dependencies, Mount element, or ManagedResource requirements.

Omit `handler` only at an external host boundary. The definition then has `toLayer` but no `.layer`, and the host supplies the constructor Effect:

```ts
import { Context, Effect } from 'effect'

import { Feature } from './name'
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

The host selects a completed feature recipe containing `RequestHostTokenLayer` before creating that feature's connection. `ApplicationLayer` still provides only ordinary Services required by the selected recipe. Subscription, Mount, ManagedResource, and experimental Query host contracts use the same boundary: `toLayer` receives the constructor Effect that returns the complete implementation.

Keep four lifetimes distinct. Application services such as RPC clients last for one Runtime start. A Command Effect lasts for one dispatch. Subscription Streams and ManagedResource handles follow Model conditions. Mount acquisition follows one DOM element. Do not capture current time, Command args, Subscription dependencies, a DOM element, or an active ManagedResource handle in an application-scoped constructor.

Handlers and services may own mutable execution bookkeeping, such as worker availability or protocol request IDs. The Model and update own pending work shown to the user, selections, and submission rules. A `Ref` created in the constructor must not become the source of truth for workflow decisions or state read by view.

Whole-application execution tests compose the same handler Layers with deterministic providers for external services before building the application Layer. Keep any business service Layer whose decoding, retries, or policy the test should cover, and replace its lower HTTP or RPC transport. That keeps Command result mapping, Subscription Stream transformation, Mount element lifecycle, and ManagedResource acquire and release behavior under test. Replacing a complete handler is a narrower way to orchestrate a result path, and does not test the replaced handler. Use Effect Layers directly for substitution rather than introducing a testing DSL.

The implementation Layer graph does not replace the registration graph. A completed child Block collects `subscriptions`, `managedResources`, and `mounts` through the same connections that supply handler Layers. Root `application.ts` creates a typed `Application` with `defineApplication`, registers its graph, and calls the registered composition's `make` or `makeElement` method. The entry imports that assembly and `ApplicationLayer`. Use a factory when the entry chooses the container; a static value is acceptable only when every importer is browser-side and runs after the intended container exists.

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

The view uses `h.OnMount(MeasurePanel())`. Put the Mount in `feature.register({ mounts })` and author the view with `registered.view`; its builder receives the registered capability automatically. A view with inputs uses `registered.view.withInputs<ViewInputs>`. For extracted helpers that attach the owner's Mounts or embed its children, use `Block.HtmlBuilderOf<typeof registered>`; pure helpers keep `HtmlBuilder<Message>`. Use `Feature.mountStream` when the element supplies an ongoing event Stream; keep listener or observer acquisition and cleanup inside the returned Stream so each element owns its own scope.

When several helpers share a mounted or child embedding path, export an alias such as `type HtmlBuilder = Block.HtmlBuilderOf<typeof registered>`. Helpers then use `h: HtmlBuilder`, or `h: Chart.HtmlBuilder` through a module namespace import. Pure helpers retain `HtmlBuilder<Message>`.

Complete each feature with its local Subscription registry. Register its connection in the parent’s `children`; composition collects the child records and preserves their Message contracts automatically. Parent Subscription activation belongs in the connection’s `subscriptions.when` policy.

## The Block Pattern

When a module grows too large, extract a Block: a child module with its own Model, Message, init, update, and optional view. Complete every Block through its definition so update, view, lifecycle registrations, and handler Layers stay in one checked contract.

Ordinary single-file and split features establish their typed identity after the Schemas exist with `Block.define('Child', { Model, Message, OutMessage })`. In a split feature, an early `block.ts` imports its contracts and exports the authoring value. Implementation files import that early value, never their completed barrel. Register Mounts and child connections when needed:

```ts
// block.ts
import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const Child = Block.define('Child', { Model, Message, OutMessage })

// children.ts
export const child = Child.register({ mounts, children })
```

Use `Child.update` and `Child.step` before registration when child policies depend on those helpers. The registered `child` retains those helpers and supplies graph-aware `child.view` / `child.view.withInputs<ViewInputs>`. If no policy inference cycle exists, chaining `Block.define(...).register(...)` is sufficient. Extra statements reflect a dependency cycle, not nesting depth.

The name-only `Block.define('Combobox')` form is reserved for generic factories sharing effect definitions before specializing several typed contracts with `.define({ Model, Message, OutMessage })`.

Finish in the named feature assembly file, such as `child/child.ts`:

```ts
export const block = child.assemble({
  init,
  update,
  view,
  steps: { close, selectItem },
  subscriptions,
  managedResources,
  EffectsLayer,
})
```

Composition is passive. It checks that every exact handler contract required by the producers and registrations is present in the selected handler graph or declared in `hostHandlers`. Ordinary API, storage, RPC, and browser service requirements remain open until the root `ApplicationLayer`; the Runtime builds those shared services once.

Declare only intentional parent-driven operations in `steps`. Connections expose them directly, such as `dialog.close()`, as parent Steps. Forward received child Messages through `dialog.fold(model, message)`; import the child Message Schema/type for wrapper declarations, but do not construct child Messages to initiate changes. The owned authoring `child.step(...)` remains a pure child Model helper.

Call `block.replaceEffectsLayer(localRecipe)` before creating a connection to replace the feature's whole local handler bundle. The selected Block retains its child connections and their recipes. Ordinary application execution tests keep the canonical handlers and provide deterministic service Layers beneath them.

### Communication

Parent → Child: the parent routes child Messages or calls a connected named Step
Child → Parent: the child returns a record with an optional `outMessage`

```ts
export const Parent = Block.define('Parent', { Model, Message })

const childConnection = Child.block.connection({
  read: (model: Model) => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  parentMessage: Message.GotChildMessage,
  subscriptions: { when: model => model.route._tag === 'Child' },
  outMessage: {
    fold: Child.OutMessage.match({
      SucceededCreateRoom: ({ roomId }) =>
        Parent.step(model => ({
          model,
          commands: [navigateToRoom(roomId)],
        })),
    }),
  },
})

export const parent = Parent.register({ children: [childConnection] })

const update = parent.update((model, message, currentUser: CurrentUser) =>
  Message.match(message, {
    GotChildMessage: ({ message }) =>
      childConnection.fold(model, message, currentUser),
  }),
)
```

Every child Block with an OutMessage requires `outMessage.fold`, `outMessage.forward`, or both. Bind its union matcher directly when the policy needs only that value. Name every variant. The connection carries Command requirements from policy Steps. A generic factory keeps one module-scope named authoring value and handler graph while refining its Schema-backed Message, OutMessage, view inputs, and named API operations per factory result.

Register the connection with `Parent.register({ children })`. The completed parent automatically aggregates the connected child's Subscriptions, ManagedResources, Mounts, and handler graph under its placement. `read` controls optional update and ManagedResource presence. `subscriptions.when` is separate Stream lifecycle policy and does not prevent update delegation.

Use `block.keyedConnection` with stable keys for dynamic collections. The parent still owns collection reconciliation and construction of its complete initial Model.

### View Delegation

Child views are embedded via `h.block`. A connection's `embedView` method supplies its canonical view and Message wrapper:

```ts
export const view = parent.view((model, h) =>
  Option.match(model.maybeChild, {
    onNone: () => h.empty,
    onSome: childModel =>
      h.block(
        childConnection.embedView({ slotId: 'child', model: childModel }),
      ),
  }),
)
```

The child defines its canonical view with `registered.view`; with per-render inputs, it uses `registered.view.withInputs<ViewInputs>` and the parent supplies `viewInputs` to `embedView`. The runtime resolves the wrapper at event time, so the child's builder dispatches only child Messages. Parent-built slot callbacks supplied in `viewInputs` retain the parent dispatch boundary.

## Subscriptions

Subscriptions are model-driven streams. They automatically start and stop based on model state.

Build them with `definition.subscriptions(entry => ({ ... }))`, where `definition` is the owning Block definition. Use the Layer-backed `entry(handlerName, fields, callbacks)` form when its lifetime depends on the Model. For those Subscriptions, provide:

- A stable handler name. Distinct definitions in one application need distinct names even when their record keys differ.
- A `fields` map (the bare field map passed as `entry`'s second argument) naming every dependency. The builder calls `Schema.Struct(fields)` internally and infers the dependency type from this map.
- A `messages` collection in `callbacks` listing the exact Message Schemas the attached handler or external `toLayer` Stream can emit. Use `messages: []` when the scoped Stream emits no Messages; that declaration requires `Stream<never>`. Scene uses the Schemas to validate both the selected `Subscription.emit` source and its Message before applying parent mappings.
- A `modelToDependencies(model)` function that returns the parameters the stream needs. Wrap an absent dependency in `Option` at the field level. The runtime restarts the stream whenever the dependencies change.
- A `handler: function* () { return dependencies => stream }` field. Errors should be mapped to a `Failed*` Message inside the stream rather than thrown. Compose `subscriptions.key.layer` directly in the owning module's `EffectsLayer`.

Name the handler for the events or scoped behavior the entry supplies, such as `KeyboardPresses`, `SystemThemeChanges`, or `GameClockTicks`. The handler name identifies the Layer requirement. Keep the record key parallel, such as `keyboardPresses`, `systemThemeChanges`, or `gameClockTicks`; the key identifies the runtime registration and Stream scope. Several lifted registrations can share one definition and handler Layer while retaining distinct keys. The Model dependencies determine when its scope is active. Avoid generic `Watch*` names that identify only the input source. Compose the entry's attached recipe directly in `EffectsLayer`; create a standalone binding such as `KeyboardPressesLayer` only when that individual provider is intentionally public or independently reused outside `EffectsLayer` assembly. Subscription lifecycle entries in DevTools are follow-up work.

For Layer-backed Subscriptions without local Model dependencies (keyboard listeners, window resize, animation frame ticks), pass the stable handler name, Message Schemas, and `handler: function* () { return () => stream }`. Use the cold `Dom.animationFrameTicks` Stream for animation frame ticks. The Subscription then stays active across local Model updates. Its parent can still gate it when lifted.

A silent Subscription can own scoped DOM state. Keep acquisition and cleanup inside the `Stream<never>` so dependency changes and runtime shutdown remove the owned style:

```ts
const subscriptions = definition.subscriptions(entry => ({
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

Use these instead of raw `document.querySelector`, `setTimeout`, `Date.now()`, or `Math.random()`. They compose naturally inside a Command's attached handler. For canonical wiring, see `repos/foldkit/examples/kanban/src/command.ts` (`FocusAddCardInput` wraps `Dom.focus`, `GenerateCardId` requires `Crypto.Crypto`) and `repos/foldkit/examples/kanban/src/entry.ts` (the root supplies `BrowserCrypto.layer`). `repos/foldkit/examples/stopwatch/src/application.ts` shows `Clock.currentTimeMillis` inside an `Effect.gen`.

## With and Without URL Routing

`const Application = defineApplication({ Model, Message }).register(...)` establishes the root graph in both cases. `Application.make(implementation)` completes it. Add a `routing` config when the app needs URL routing.

### Without Routing

For single-page apps that own the page but don't navigate. init receives only Flags (if any):

```ts
import { define as defineApplication } from 'foldkit/application'

const Application = defineApplication({ Model, Message }).register({})

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
```

### With Routing

For apps with pages, navigation, and URL-driven state. init receives Flags (if any) and the current URL. Add a `routing` config with two Message constructors:

```ts
import { define as defineApplication } from 'foldkit/application'

const Application = defineApplication({ Model, Message }).register({ children })

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

Runtime.run(application.provide(ApplicationLayer))
```

### Scoped to a Node (Embedded Widgets)

The registered composition's `make` method assumes it owns the page. Its `view` returns a `Document` (`{ title, lang?, dir?, canonical?, ogUrl?, body }`), and the runtime manages `document.title`, the `lang` and `dir` attributes on `<html>`, `<link rel="canonical">`, and `<meta property="og:url">`. A widget embedded on a page does not own that metadata.

Use the registered composition's `makeElement` method instead. Its `view` returns `Html` directly (no title to discard) and the runtime never touches the document `<head>` or the `<html>` element. Everything else (Model, init, update, Commands, Subscriptions, Flags, crash handling) is identical. Embedded apps don't own the URL bar, so `makeElement` has no `routing` config.

```ts
const element = Application.makeElement({
  ...implementation,
  container: document.getElementById('widget'),
})

Runtime.run(element.provide(ApplicationLayer))
```

Element Flags are self-contained in the assembly config. A host factory can turn its initial data into the Flags Effect, then provide the Element's root service Layer:

```ts
export const makeElement = (container: HTMLElement, flags: Flags) =>
  Application.makeElement({
    ...implementation,
    Flags,
    flags: Effect.succeed(flags),
    container,
  }).provide(ApplicationLayer)
```

When the host application needs to control the embedded app (mount and unmount it, push data in, receive values out), start it with `Runtime.embed(program)` instead of `Runtime.run`. `embed` returns a handle with `dispose` plus one entry per Port declared on the config: the host sends on inbound Ports, subscribes to outbound Ports, and disposes on unmount, never touching the Model. Inbound Ports are consumed by the app as Subscription sources and outbound Ports are written from Commands, so the app itself stays inside the standard architecture. `repos/foldkit/examples/embedding/` shows the full pattern: the widget in `src/application.ts`, the host in `src/host.ts`.

### Document Metadata

With `make`, the `view` returns a `Document`. The runtime writes `title` to `document.title` after every render. It never derives `canonical` from the address bar. Build the canonical from the typed route in the Model, where the application can decide which route and query values identify the page.

If no render supplies `canonical`, the runtime leaves a served `<link rel="canonical">` unchanged or keeps the document without one. Before the client first writes a canonical, it records the existing `href`. A later omission restores that value, or removes the element if the runtime created it. During hydration, the recorded value can be the initial route's server-rendered canonical, so omission means restore that baseline rather than remove every canonical.

`ogUrl` can be supplied independently. An omitted `ogUrl` uses an explicit `canonical`, and its restore or removal behavior is the same. `Server.renderToString` returns only a canonical supplied by the view and gives `ogUrl` the explicit canonical when `ogUrl` is omitted. It does not derive either field from `Request.url`.

With `makeElement`, the runtime does not manage the title or document metadata.

`lang` and `dir` sync to the `<html>` element, so an app that switches language at runtime drives them from the Model. `dir` is `TextDirection` from `foldkit/html`, a Schema over `'Ltr' | 'Rtl' | 'Auto'` that you can drop straight into a Model `Schema.Struct`, and the runtime writes it as the lowercase attribute value. Both fields are optional and have no default: when a view omits one, the runtime does not touch that attribute, leaving whatever value it currently holds, so a view that never sets it leaves the served HTML in place.

`onUrlRequest` fires when the user clicks a link. The Message receives a `UrlRequest` (a tagged union from the `Navigation` namespace) which you handle in update by matching on its `_tag`. `onUrlChange` fires when the browser URL changes (back/forward buttons); the handler updates the route from the new URL.

For the canonical update-handler shapes (the exact `UrlRequest` tag names, how to dispatch `pushUrl` vs an external load Command, and how to derive the route from a `Url`), see `repos/foldkit/examples/routing/src/application.ts`.

### How to Choose

- App is a widget embedded on a page it does not own (must not touch the host `<head>`) → the registered composition's `makeElement`
- The host application also needs to drive it (lifecycle, data in, values out) → `makeElement` started with `Runtime.embed`, communicating through Flags and Ports
- App owns the page and mentions "pages", "navigation", "routes", URLs → the registered composition's `make` with `routing` config
- App owns the page with no navigation → the registered composition's `make` without `routing`
