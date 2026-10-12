---
'foldkit': minor
'@foldkit/ui': minor
---

Add checked Submodel descriptors for multi-file feature authoring and static parent placement.

`Submodel.owner(namespace)` establishes one Submodel runtime identity before its effect definitions exist. Pass `owner.name('Operation')` to locally owned Commands, Subscriptions, Mounts, and ManagedResources to qualify their plain string protocol names, then call `owner.define({ Model, Message, OutMessage?, mounts?, children? })` once the Schemas are available. The returned contract contextually types `defineUpdate`, `defineView`, `defineView.withInputs`, and named `defineStep` entry points.

Complete the contract with `compose`. It checks the exact Command and lifecycle handler requirements against the selected `EffectsLayer` and explicit `hostHandlers`, then returns a passive descriptor. It does not build Layers or start effects. A parent calls the descriptor's `bind` method with its Model accessors, Message wrapper, Subscription gates, and OutMessage policy. Registering the binding in the parent's `children` automatically collects its Subscriptions, ManagedResources, Mounts, and handler Layer graph.

The recommended multi-file shape keeps the descriptor private while exposing `Home.bind` and the registrations needed at the application root:

```ts
// owner.ts
export const owner = Submodel.owner('App/Home')

// command.ts
export const LoadFeed = Command.define(owner.name('LoadFeed'), { ... })

// definition.ts
export const contract = owner.define({ Model, Message, OutMessage })

// submodel.ts
const descriptor = contract.compose({
  init,
  update,
  view,
  steps: { refresh },
  subscriptions: localSubscriptions,
  EffectsLayer: LocalEffectsLayer,
})

export const bind = descriptor.bind
export const subscriptions = descriptor.subscriptions
export const EffectsLayer = descriptor.EffectsLayer
```

Replace separate child update, lifecycle, Layer, and view wiring with one binding.

Before:

```ts
// Update, lifecycle, Layer, and view wiring each describe this placement.
const foldHome = Update.foldChild({
  update: Home.update,
  read: model => Option.some(model.home),
  write: (model, nextHome) =>
    modifyFields(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  foldOutMessage: Home.OutMessage.match({ ... }),
})

const subscriptions = Subscription.aggregate(
  Subscription.lift(Home.subscriptions)<Model, Message>({
    read: model => Option.some(model.home),
    toParentMessage: message => Message.GotHomeMessage({ message }),
  }),
  localSubscriptions,
)

const EffectsLayer = Layer.mergeAll(Home.EffectsLayer, LocalEffectsLayer)

h.submodel({
  slotId: 'home',
  model: model.home,
  view: Home.view,
  toParentMessage: message => Message.GotHomeMessage({ message }),
})
```

After:

```ts
// The binding carries every policy for this static placement.
const home = Home.bind({
  placement: 'home',
  read: model => Option.some(model.home),
  write: (model, nextHome) =>
    modifyFields(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  subscriptions: { when: model => model.route._tag === 'Home' },
  outMessage: {
    fold: Home.OutMessage.match({ ... }),
  },
})

export const contract = owner.define({
  Model,
  Message,
  children: [home],
})

const descriptor = contract.compose({
  init,
  update,
  EffectsLayer: LocalEffectsLayer,
})

h.submodel(home.embed({ slotId: 'home', model: model.home }))
```

In the parent wrapper handler, replace `foldHome(model, message, ...context)` with `home.fold(model, message, ...context)`. Use `home.step(message, ...context)` when composing the primary update as a deferred parent Step, or `home.steps.refresh(...args)` for a named child entry point.

Bindings represent static placements. Continue to use `Update.foldChildAt` and explicit lifecycle lifting for dynamically keyed collections. Child initialization also remains explicit through `Update.foldChildInit` or `Update.foldChildInits` because the parent owns construction of its complete Model.

Select an alternate whole local handler bundle before binding with `descriptor.withEffectsLayer(localRecipe)`. The returned descriptor replaces the local recipe, retains the already-selected child recipes, and remains passive until the application Runtime builds its Layer. The original recipe is not built as part of the selected graph. Use the original definitions' `toLayer` methods so replacement providers retain their exact protocols and runtime identities.

```ts
// Select the feature implementation before creating its static placement.
const home = Home.withEffectsLayer(HomeTestLayer).bind({
  placement: 'home',
  read,
  write,
  toParentMessage,
  outMessage: { fold: Home.OutMessage.match({ ... }) },
})
```

Here `Home.withEffectsLayer` projects the private descriptor's method. Register this selected binding in the parent's `children` instead of the canonical binding. Ordinary application execution tests should retain canonical handlers and replace their underlying service providers; whole-feature recipe selection replaces the handler implementations themselves.

Simultaneous descriptors or placements that reuse one Owner must select the same local `EffectsLayer` object. Define that recipe once at module scope. Foldkit rejects separately constructed equivalent Layer values because their types cannot prove that they select the same providers. The descriptor's projected `EffectsLayer` is the complete graph, including children; the identity rule applies to the local recipe supplied to `compose` or `withEffectsLayer`.

`Combobox.create` and `Combobox.Multi.create` now accept an optional Item Schema and return complete checked descriptors. The Schema preserves refined Message, OutMessage, view input, and Step payloads. Programmatic entry points move under `steps`, and parents can bind the canonical view directly.

Before:

```ts
// The type argument refines only the older helper bundle.
type City = 'Boston' | 'Chicago'

const CityCombobox = Combobox.create<City>()

const citySelect = CityCombobox.selectItem(model.combobox, city, city)
```

After:

```ts
// The Schema refines the complete descriptor and every bound channel.
const City = Schema.Literals(['Boston', 'Chicago'])

const CityCombobox = Combobox.create(City)
const cityCombobox = CityCombobox.bind({
  placement: 'city',
  read,
  write,
  toParentMessage,
  outMessage: {
    fold: CityCombobox.OutMessage.match({
      Selected: ({ value }) => storeCity(value),
      ClearedSelection: () => clearCity,
    }),
  },
})

const citySelect = cityCombobox.steps.selectItem(city, city)(model)

h.submodel(
  cityCombobox.embed({
    slotId: 'city',
    model: model.combobox,
    viewInputs,
  }),
)
```

Calling `Combobox.create()` without a Schema returns the broad string descriptor.
