---
'foldkit': minor
'@foldkit/ui': minor
'@foldkit/devtools': minor
'create-foldkit-app': minor
---

Replace manual Block wiring with mandatory, checked Block composition.

Build applications from Blocks. Fold their updates into a single application Model. A Block's local identity and Model/Message contracts establish its authoring boundary. Parent connections derive the complete runtime path, so the child never encodes where it will be embedded.

```ts
// home/block.ts
import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const Home = Block.define('Home', { Model, Message, OutMessage })

// home/command.ts
import { Effect } from 'effect'

import { Home } from './block'
import { Message } from './message'
import { Feed } from './service/feed'

export const LoadFeed = Home.command('LoadFeed', {
  messages: [Message.SucceededLoadFeed, Message.FailedLoadFeed],
  handler: function* () {
    const feed = yield* Feed

    return () =>
      feed.load.pipe(
        Effect.map(articles => Message.SucceededLoadFeed({ articles })),
        Effect.catch(() => Effect.succeed(Message.FailedLoadFeed())),
      )
  },
})

// home/home.ts
import { Home } from './block'
import { LoadFeed } from './command'
import { init } from './init'
import { update } from './update'
import { subscriptions } from './subscription'
import { view } from './view'

const EffectsLayer = LoadFeed.layer

export const block = Home.assemble({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
})

// home/index.ts
export { block } from './home'
export { Model } from './model'
export { Message, OutMessage } from './message'

// page/index.ts
export * as Home from './home'

// Parent
import * as Home from './page/home'
```

`Block.define(id, { Model, Message, OutMessage? })` establishes the identity and typed helpers together. Block IDs and owned effect names must be nonempty segments without `/` or `::`; composition supplies the path separators. Owned primitive methods (`command`, `mount`, `mountStream`, `resource`) and pure/lifecycle authoring methods (`update`, `step`, `view`, `subscriptions`, `managedResources`) supply contextual types. Remove repeated Model/Message callback annotations; keep additional operation/context parameters and `view.withInputs<ViewInputs>` when they carry information the owner cannot infer.

Use `register({ children, mounts })` for the graph, then `assemble` for the implementation. Registration preserves the established helpers and adds the graph's view capabilities. Chain definition and registration when policies do not depend on earlier parent operations. Otherwise, author those operations using `Home` first and name the registered value `home`. An inference cycle comes from those dependencies, not from nesting depth.

`assemble` checks init, update, public Steps, view, lifecycle declarations, and local handler completeness. Omit `EffectsLayer` for a pure feature or one fully supplied by registered children. Missing local handlers still fail unless explicitly listed in `hostHandlers`; delegated handlers remain requirements at root. Ordinary Service requirements and constructor errors continue through composition.

A specialized generic component may establish shared effects first with `const Combobox = Block.define('Combobox')`, then use `Combobox.define(contracts)` for its single/multi and refined item contracts. This is the one-argument form of the same entry point. Ordinary features need no separate naming stage.

Export the completed `block` and standard structural pieces from an explicit feature barrel. Parents use a namespace, such as `Home.Model`, `Home.Message`, `Home.OutMessage.match`, and `Home.block.connection`. Keep domain helpers as ordinary exports; do not project composition methods or expose an aggregate Layer as a second completion path.

Before:

```ts
import { Layer, Option } from 'effect'
import { Submodel, Subscription, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import * as Home from './page/home'

const foldHome = Update.foldChild({
  update: Home.update,
  read: (model: Model) => Option.some(model.home),
  write: (model, nextHome) => modifyFields(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  foldOutMessage: Home.OutMessage.match({
    SelectedArticle: ({ articleId }) => openArticle(articleId),
  }),
})

const subscriptions = Subscription.aggregate(
  Subscription.lift(Home.subscriptions)<Model, Message>({
    read: (model: Model) => Option.some(model.home),
    toParentMessage: message => Message.GotHomeMessage({ message }),
  }),
  localSubscriptions,
)

const EffectsLayer = Layer.mergeAll(Home.EffectsLayer, LocalEffectsLayer)

const view = Submodel.defineView<Model, Message>((model, h) =>
  h.submodel({
    slotId: 'home',
    model: model.home,
    view: Home.view,
    toParentMessage: message => Message.GotHomeMessage({ message }),
  }),
)
```

After:

```ts
import { define as defineApplication } from 'foldkit/application'
import * as Update from 'foldkit/update'

import * as Home from './page/home'
import { Message } from './message'
import { Model } from './model'
import { openArticle } from './operation'

export { init } from './init'
export { localSubscriptions as subscriptions } from './subscription'
export { LocalEffectsLayer as EffectsLayer } from './layer'

const foldHomeOutMessage = Home.OutMessage.match<Update.Step<Model, Message>>({
  SelectedArticle: ({ articleId }) => openArticle(articleId),
})

const home = Home.block.connection({
  Model,
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  outMessage: { fold: foldHomeOutMessage },
})

export const Application = defineApplication({ Model, Message }).register({
  children: [home],
})

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotHomeMessage: ({ message }) => home.fold(model, message),
  }),
)

export const view = Application.view((model, h) => ({
  title: 'Articles',
  body: h.block(home.embedView({ slotId: 'home', model: model.home })),
}))

// entry.ts supplies init, update, view, subscriptions and EffectsLayer
// to Application.make together with the browser container.
```

The binding carries the placement's Model access, Message wrapper, OutMessage policy, Subscription gate, and canonical view. It also contributes the child's Subscriptions, ManagedResources, Mounts, and handler Layer recipe to its parent. Use `home.fold(model, message, ...context)` to forward a received child Message, `home.refresh(...args)` for a named parent-driven operation, and `home.init(...args)` for child initialization. The binding exposes no generic deferred Message-dispatch method. Importing the child Message Schema/type for the parent's `GotHomeMessage` wrapper remains valid.

Public operations are pure Steps. Declare them under `steps: { open, close }` and invoke them through `binding.open()` or `binding.close()`. They inherit the same Command scoping, Message lifting, OutMessage policy, ManagedResource access, and absent-child behavior as `fold`; registered operations also participate in handler completeness checks. Omit `steps` when there are no public operations. The owned authoring helper `Home.step(...)` defines operations over the child Model; the connection exposes only the operations selected in the `steps` record. Operation names cannot collide with built-in connection members such as `fold`, `init` or `embedView`. A shared pure helper is valid, and update delegation must use a truthful Message such as `RequestedClose`, not a fabricated button click.

Root `application.ts` owns Application configuration; `entry.ts` chooses the browser container and startup inputs and calls `Runtime.run`. Shared infrastructure providers live in `services.ts` and export `ApplicationLayer`. Assemble a feature in `home/home.ts`, with an explicit `index.ts` barrel. Keep an early `block.ts` declaration when split implementation files need it; extract `layer.ts` or `children.ts` when substantial composition benefits from its own file.

The local name stays `Home` wherever the feature is reused. Placement defaults to the direct `field`, or the child Block ID for accessor connections; an explicit `placement` overrides either. Two direct fields therefore identify two distinct occurrences. Changing a direct-field connection from the earlier child-ID default to its field changes the derived Command, Subscription, Mount, and ManagedResource paths. Keyed-instance identity is unchanged.

Use `keyedConnection` for a dynamic keyed collection. It declares collection access and placement policy once while every occurrence keeps a stable key.

```ts
import * as Row from './row'
import { Message } from './message'
import { Model } from './model'
import { Block } from 'foldkit'
import { replaceRow } from './rows'

const rows = Row.block.keyedConnection({
  readAll: (model: Model) => model.rows,
  key: row => row.id,
  read: row => row,
  writeAt: (model, rowId, nextRow) => replaceRow(model, rowId, nextRow),
  toParentMessage: (rowId, message) =>
    Message.GotRowMessage({ rowId, message }),
})

const Table = Block.define('Table', { Model, Message }).register({
  children: [rows],
})
```

An optional binding returns `Option.none()` while its child is absent. Foldkit then stops that occurrence's active Subscriptions, Mounts, and ManagedResources. Commands already started by that occurrence retain application lifetime, and Foldkit discards results whose originating occurrence no longer exists. `keyedConnection` applies the same rule per key.

Handler recipes are selected before binding. Use `block.replaceEffectsLayer(EffectsTestLayer)` only when a test or host intentionally replaces the feature's handlers. Ordinary application tests should keep the canonical handlers and replace the Services they use. A reusable feature that leaves handlers to its host can declare them in `hostHandlers`; the host completes it with `block.provideHandlers(HostHandlersLayer)`.

The Application defines the root Model, Message, and registered child graph. It owns `make` and `makeElement`; their configs supply the implementation and host inputs. The root provider contains ordinary Services only.

Before:

```ts
// main.ts
import { Runtime } from 'foldkit'

import { AppLayer } from './resources'

export const application = Runtime.makeApplication({
  Model,
  Flags,
  flags,
  init,
  update,
  view,
  subscriptions,
  managedResources,
  mounts,
  resources: AppLayer,
  container: document.getElementById('root'),
})

Runtime.run(application)
```

After:

```ts
// application.ts
import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import { children } from './children'
import { mounts } from './mount'

export const Application = defineApplication({ Model, Message }).register({
  children,
  mounts,
})

export { Flags, flags } from './flags'
export { init } from './init'
export { update } from './update'
export { view } from './view'
export { subscriptions } from './subscription'
export { managedResources } from './managedResource'
export { EffectsLayer } from './effects'

// entry.ts
import { Runtime } from 'foldkit'

import {
  Application,
  Flags,
  flags,
  init,
  update,
  view,
  subscriptions,
  managedResources,
  EffectsLayer,
} from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  init,
  update,
  view,
  subscriptions,
  managedResources,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer), { flags })
```

Use capitalized `Application` for the typed definition and lowercase `application` for the completed runtime input. Rename root assembly `main.ts` to `application.ts`, root providers `AppLayer` / `AppTestLayer` to `ApplicationLayer` / `ApplicationTestLayer`, and the root Route union `AppRoute` to `ApplicationRoute`. Standard structural exports stay Model, Message, OutMessage, Flags, init, update, and view. The public subpath is `foldkit/application`; import its factory as `defineApplication`. Module-level `make` and `makeElement` are replaced by owned methods, and the completed program supplies ordinary Services through `application.provide(ApplicationLayer)` or `element.provide(ApplicationLayer)`.

The entry supplies browser inputs. Definition and completion retain precise requirements without constructing Layers or executing handlers. The Runtime builds the graph when it starts. Registered and graphless definitions have the same completion methods.

Server rendering takes that same definition plus its implementation and request inputs. It does not build browser handler Layers or start lifecycle work:

```ts
import { Server } from 'foldkit/experimental'

import { Application, Flags, init, update, view } from './application'

Server.renderToString(
  Application,
  { init, update, view, Flags, routing: {} },
  { url: request.url, flags },
)
```

Stateful UI components expose their completed `block` instead of a separate aggregate `EffectsLayer`. Register its binding under `children` to include the selected handlers automatically. Focused execution tests can access `block.EffectsLayer`.

`Combobox.create` and `Combobox.Multi.create` return completed Blocks. Bind the returned value, use its bound API operations, and embed its bound view. Pass an Item Schema to preserve the refined Message, OutMessage, and Step payloads.

```ts
import { Combobox } from '@foldkit/ui'
import { Schema } from 'effect'

const City = Schema.Literals(['Boston', 'Chicago'])
const CityCombobox = Combobox.create(City)

const cityCombobox = CityCombobox.connection({
  placement: 'CityCombobox',
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

const citySelect = cityCombobox.selectItem(city, city)(model)

h.block(
  cityCombobox.embedView({
    slotId: 'city',
    model: model.combobox,
    viewInputs,
  }),
)
```
