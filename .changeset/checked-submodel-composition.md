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

// page/index.ts
export * as Home from './home'
```

Parents import the Home namespace from the parent barrel and bind `Home.block`.

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
import { defineApplication } from 'foldkit'

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

The direct field form infers the parent Model and child Model relationship for exact `ChildModel` and `Option<ChildModel>` fields. Both forms keep the field name as their default placement. `None` makes an optional field absent, and a fold or exposed operation never creates it. Add `presentWhen` when parent policy gates that whole direct child. Use explicit `read` and `write` for tagged, nested, or custom storage. Foldkit compares decoded built-in Schema shapes; reuse the same Schema instance for an opaque declaration or keep custom accessors. Use `toParentMessage` for a custom wrapper. Do not pass a redundant Model Schema.

Keep straightforward parent Bindings together in `childBindings.ts`. Small wiring can stay in `application.ts` or the parent `block.ts`. When one child needs substantial parent policy, put that Binding and policy in `childBindings/<child>.ts`. In that layout, `childBindings/childBindings.ts` exports the complete `children` tuple with `as const`, while the explicit `childBindings/index.ts` exports the named Bindings and `children`. Do not divide Bindings into arbitrary groups such as `pages` or `controls`.

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
import { defineApplication } from 'foldkit'

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

A keyed Binding uses the same parent-owned method. When a field is an array of child Models, a string-valued `key` names their stable identity field:

```ts
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Row } from './row'

const Table = Block.define('Table', { Model, Message })

export const rows = Table.bindChild(Row.block, {
  placement: 'Row',
  field: 'rows',
  key: 'id',
  toParentMessage: (rowId, message) =>
    Message.GotRowMessage({ rowId, message }),
})

export const TableComposition = Table.toComposition({
  children: [rows],
})
```

The child Schema must expose its declared Struct fields. Use the general keyed form for a union Model or a Schema without declared fields. The shorthand otherwise defaults placement to `field`. Keep the previous Block-ID placement explicitly when migrating an existing general keyed Binding whose resolved identity differs, as above. The child Model returned by `init(key, ...)` must contain that key, and child folds and operations cannot change it. Parent update owns collection membership, so it replaces identity by removing one Model and adding another.

A required `Schema.Array` field on a parent Struct can store closed Struct wrappers around child Models. Add `childField` when `key` belongs to the wrapper.

Before:

```ts
import { Array } from 'effect'
import { modifyFields } from 'foldkit/struct'

export const applicants = Application.bindChild(Applicant.block, {
  readAll: model => model.applicants,
  key: applicant => applicant.id,
  read: applicant => applicant.entry,
  writeAt: (model, applicantId, nextEntry) =>
    modifyFields(model, {
      applicants: Array.map(applicant =>
        applicant.id === applicantId
          ? modifyFields(applicant, { entry: () => nextEntry })
          : applicant,
      ),
    }),
  toParentMessage: (applicantId, message) =>
    Message.GotApplicantMessage({ applicantId, message }),
})
```

After:

```ts
export const applicants = Application.bindChild(Applicant.block, {
  placement: 'Applicant',
  field: 'applicants',
  key: 'id',
  childField: 'entry',
  toParentMessage: (applicantId, message) =>
    Message.GotApplicantMessage({ applicantId, message }),
})
```

`key` must name a required string or finite-number wrapper field, and `childField` must name a different required field whose Schema has exactly the same decoded shape as the child Model. The child Model may be a primitive or union because its identity stays on the wrapper. A child write replaces only the matching wrapper's child field, preserving its metadata, array position, and every unmatched wrapper reference. It does not insert a wrapper after parent update has removed that key. Placement defaults to `field`; retain the old Block-ID placement explicitly if the existing Binding's resolved identity must stay the same.

Use `readAll`, function-valued `key`, `read`, and `writeAt` for custom parent writes, opaque, union, or open/index-signature wrappers, and collections such as `Option<RoomInstance>` that enumerate zero or one child. These explicit accessors continue to define application-specific storage and enumeration policy.

Use a keyed Binding for a routed child when its domain ID changes, even if only one instance is present at a time. Capture the key in `toParentMessage` so delayed Command results and Subscription emissions retain their origin. Replacing the key retires that occurrence and its dispatchers; reusing the key later creates a new occurrence. Running Commands retain application lifetime, so isolate external writes by domain ID when their completion must not overwrite another instance's data.

A Query uses the same Binding path because Query and KeyedQuery are completed viewless Blocks. A KeyedQuery's keyed entries remain cache data inside one child Model; they are not keyed Block instances.

```ts
import { Schema } from 'effect'
import { Query } from 'foldkit/experimental'
import { defineApplication } from 'foldkit'

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

## Use plain feature-local view helpers

`Composition.render`, `render.builder`, and `render.withInput` are removed. The canonical owned view still uses `Composition.view` or `view.withInputs`. Ordinary helpers are plain functions with purposeful parameters.

Before:

```ts
import type { Article } from './article'
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

After, keep the early root contract separate when child Bindings import its helpers:

```ts
// definition.ts
import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const Application = defineApplication({ Model, Message })

// application.ts
import type { Block } from 'foldkit'

import { children } from './childBindings'
import { Application } from './definition'
import { mounts } from './mount'

export { Application } from './definition'

export const ApplicationComposition = Application.toComposition({
  children,
  mounts,
})
export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>
```

Then in the feature's helper module:

```ts
import type { Article } from './article'
import type { ViewBuilder } from './application'
import type { Model } from './model'

export const headerView = (h: ViewBuilder) => h.header([], ['Articles'])

export const articleCard = (article: Article, h: ViewBuilder) =>
  h.article([], [article.title])

export const articleList = (model: Model, h: ViewBuilder) =>
  h.ul(
    [],
    model.articles.map(article => h.li([], [article.title])),
  )
```

`Block.HtmlBuilderOf<typeof ApplicationComposition>` carries the root Message type plus its registered child and Mount capabilities. It is a type alias and constructs no runtime builder. A helper takes only the Model, domain value, or context it actually reads; TypeScript infers one `Html` result or an array. Keep the framework's general `HtmlBuilder<Message>` for functions genuinely shared across owners.

## Name and organize the final roles

Use `Foo`, `FooComposition`, and `block`. Use `Application`, `ApplicationComposition`, and lowercase `application` or `element` at the root.

- `definition.ts`: early Model, Message, OutMessage, and Block authoring contracts when split implementation files need them.
- A folder-named implementation file, such as `workHistory/workHistory.ts`: substantial feature logic that does not warrant separate init/update/command files.
- `block.ts`: completed feature assembly.
- `childBindings.ts`: straightforward parent-owned child Bindings; use `childBindings/<child>.ts` for an individual substantial policy.
- `application.ts`: root Application graph, Composition, and cohesive root behavior. Small root Bindings can stay here; extract substantial integration to `childBindings.ts` or `childBindings/`.
- `entry.ts`: container, startup inputs, root Service providers, and Runtime startup.
- `layer.ts`: substantial or reused Layer composition at that directory boundary.

A compact root defines `Application` directly in `application.ts`. When split root Commands, Subscriptions, or child Bindings need that authoring value before Composition assembly, put its early contract in `definition.ts`. Those modules import the contract there; `application.ts` imports and re-exports `Application` and exports `ApplicationComposition`. Entry completion still imports each implementation field from its real owner.

Keep final completion in `block.ts` when the view imports its Composition and Bindings from the implementation. The final assembly imports both modules, so the implementation never needs to import a view that depends on it. Do not create one file per API stage. Keep small examples compact. Use explicit barrels for intended feature contracts and import private implementations directly in tests.

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
import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const Application = defineApplication({ Model, Message })
export const ApplicationComposition = Application.toComposition()

// entry.ts
import { Runtime } from 'foldkit'

import { ApplicationComposition } from './application'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
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
