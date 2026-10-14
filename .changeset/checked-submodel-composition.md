---
'foldkit': minor
'@foldkit/ui': minor
'@foldkit/devtools': minor
'create-foldkit-app': minor
---

Replace manual Block wiring and child-owned connection factories with checked Definition → Composition → Block assembly and parent-owned Bindings.

## Complete every Block through a Composition

A Definition establishes the Model, Message, and optional OutMessage contracts. A Composition establishes child Bindings and Mount capabilities. `toBlock` brings the implementation together and checks handler completeness.

Before:

```ts
import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const HomeDefinition = Block.define('Home', { Model, Message, OutMessage })

export const block = HomeDefinition.toBlock({ init, update, view })
```

After:

```ts
// definition.ts
import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const Home = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})

// block.ts
import { Home } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const HomeComposition = Home.toComposition()

export const block = HomeComposition.toBlock({ init, update, view })

// index.ts
export { block } from './block'
export { Message, OutMessage } from './message'
export { Model } from './model'
```

`children` and `mounts` are independently optional. Use `toComposition()`, `toComposition({ children })`, `toComposition({ mounts })`, or `toComposition({ children, mounts })`. Omitted registrations grant no capabilities. Keep operations required by child policy on the authoring value; the Composition retains the established authoring helpers.

Use the one-argument `Block.define('Feature')` form only for a generic factory that shares definitions before specializing several contracts with `.define(...)`. Ordinary features establish their contracts in the first call.

## Move child integration to the parent

A completed child Block no longer creates a connection. The parent authoring value creates the Binding because the parent owns Model access, Message mapping, OutMessage policy, and lifecycle policy.

Before:

```ts
import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { Home } from './page'
import { Message } from './message'
import { Model } from './model'

const home = Home.block.connection({
  Model,
  read: model => Option.some(model.home),
  write: (model, nextHome) => modifyFields(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
})
```

After:

```ts
import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import { Home } from './page'

export const Application = defineApplication({ Model, Message })

export const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [home],
})
```

The direct field form infers the parent Model and child Model relationship. Use explicit `read` and `write` for optional, tagged, or custom storage. Use `toParentMessage` for a custom wrapper. Do not pass a redundant Model Schema.

Substantial parent wiring belongs in `childBindings.ts`. It may configure several children. Small wiring can stay in `application.ts` or the parent `block.ts`.

The Binding projects `init`, `fold`, `embedView`, and operations selected under `expose`:

```ts
export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    GotHomeMessage: ({ message }) => home.fold(model, message),
    ClickedRefresh: () => home.refresh()(model),
  }),
)
```

The parent configures OutMessage policy in its Binding. That policy executes during the pure child fold or exposed operation:

parent update → child fold or operation → parent OutMessage handling → parent result

```ts
import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import { openArticle } from './operation'
import { Home } from './page'

export const Application = defineApplication({ Model, Message })

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedArticle: ({ articleId }) => openArticle(articleId),
})

export const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  outMessage: { fold: foldHomeOutMessage },
})
```

`outMessage.fold` handles variants locally. Add an exhaustive `outMessage.forward` only when at least one variant continues through the current Block's OutMessage. A derived OutMessage takes precedence over forwarding for the same dispatch; local handling still runs.

A keyed Binding uses the same parent-owned method. `readAll` selects the collection and distinguishes it from a static Binding:

```ts
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Row } from './row'
import { replaceRow } from './rows'

const Table = Block.define('Table', { Model, Message })

export const rows = Table.bindChild(Row.block, {
  readAll: model => model.rows,
  key: row => row.id,
  read: row => row,
  writeAt: (model, rowId, nextRow) => replaceRow(model, rowId, nextRow),
  toParentMessage: (rowId, message) =>
    Message.GotRowMessage({ rowId, message }),
})

export const TableComposition = Table.toComposition({
  children: [rows],
})
```

A Query uses the same Binding path because Query and KeyedQuery are completed viewless Blocks. A KeyedQuery's keyed entries remain cache data inside one child Model; they are not keyed Block instances.

```ts
import { Schema } from 'effect'
import { Query } from 'foldkit/experimental'
import { define as defineApplication } from 'foldkit/application'

import { fetchPosts } from './api'
import { Message } from './message'
import { Model } from './model'
import { Post } from './post'

const Posts = Schema.Array(Post)

export const postsQuery = Query.define({
  name: 'Posts',
  data: Posts,
  error: Schema.String,
  handler: function* () {
    return () => fetchPosts
  },
})

export const Application = defineApplication({ Model, Message })

export const posts = Application.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [posts],
})
```

Query preserves `Model`, `Message`, `Fetch`, direct `read` and `run`, cache generations, stale response protection, loading, refresh and reset operations, cache key typing, and precise handler constructor error and Service requirements. A canonical handler contributes `query.EffectsLayer`. A host-owned Query omits `handler`, lists the unresolved Fetch contract on its Block, and is completed with `query.provideHandlers(query.toLayer(...))` before binding.

## Use Composition-owned rendering helpers

A Composition supplies the Model, Message, and registered capabilities for ordinary owned helpers:

```ts
import { ApplicationComposition } from './application'

export const headerView = ApplicationComposition.render.builder(h =>
  h.header([], ['Articles']),
)

export const articleCard = ApplicationComposition.render.withInput<Article>()(
  (article, h) => h.article([], [article.title]),
)

export const articleList = ApplicationComposition.render((model, h) =>
  h.ul(
    [],
    model.articles.map(article => h.li([], [article.title])),
  ),
)
```

Keep plain generic rendering helpers for code deliberately reusable across owners. Use `HtmlBuilderOf<typeof Composition>` for a meaningful public interface with a different signature, including helpers that preserve caller-provided capability generics. Do not add an unused Model parameter solely to obtain contextual typing.

## Name and organize the final roles

Use `Foo`, `FooComposition`, and `block`. Use `Application`, `ApplicationComposition`, and lowercase `application` or `element` at the root.

- `definition.ts`: an early authoring dependency when split implementation files need it.
- `block.ts`: completed feature assembly.
- `childBindings.ts`: substantial parent-owned child integration.
- `application.ts`: root Application, Bindings, Composition, and cohesive root behavior.
- `entry.ts`: container, startup inputs, root Service providers, and Runtime startup.
- `layer.ts`: substantial or reused Layer composition at that directory boundary.

Do not create one file per API stage. Keep small examples compact. Use explicit barrels for intended feature contracts and import private implementations directly in tests.

`EffectsLayer` supplies implementations of declared Commands, Subscriptions, Mounts, ManagedResources, and Query Fetch Commands. `ApplicationLayer` supplies ordinary Services required by those handlers and startup Effects. Compose a small feature `EffectsLayer` in `block.ts`; use feature `layer.ts` when substantial. Keep a small `ApplicationLayer` in `entry.ts`; use root `layer.ts` when substantial or reused. Remove `services.ts` files that only rename or merge a tiny provider bundle.

## Complete the root through ApplicationComposition

Before:

```ts
import { Runtime } from 'foldkit'

import { Model } from './model'
import { AppLayer } from './resources'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
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

export const Application = defineApplication({ Model, Message })
export const ApplicationComposition = Application.toComposition()

// entry.ts
import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application)
```

Call `application.provide(ApplicationLayer)` or `element.provide(ApplicationLayer)` when ordinary Services remain. `application.provide` is an instance method on the completed passive program. There is no standalone `provide` function and no `Application.provide` method.

Server rendering receives the same passive Composition and explicit implementation fields:

```ts
import { Server } from 'foldkit/experimental'

import { ApplicationComposition } from './application'
import { Flags } from './flags'
import { init } from './init'
import { update } from './update'
import { view } from './view'

Server.renderToString(
  ApplicationComposition,
  { init, update, view, Flags, routing: {} },
  { url: request.url, flags },
)
```

## Enforcement boundaries

TypeScript checks contracts, precise handler and Service requirements, constructor errors, handler completeness, registration evidence, exposed operation requirements, and Mount or child capabilities through emitted declarations.

Runtime identity maps and lifecycle generations enforce exact occurrence identity, stale Command and callback suppression, keyed generation isolation, Mount ownership, and the private identity of structurally identical handler protocols. These are runtime guarantees rather than type-level proofs.

Lint rules enforce repository naming and architectural conventions such as authoring and Composition value names and avoiding direct child state updates. File names, narrow barrels, section heading restraint, and the distinction between substantial and small Layer modules remain review conventions.
