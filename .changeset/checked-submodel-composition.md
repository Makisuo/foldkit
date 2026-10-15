---
'foldkit': minor
'@foldkit/ui': minor
'@foldkit/devtools': minor
'create-foldkit-app': minor
---

Replace manual Block wiring and child-owned connection factories with checked Definition → Composition → Block assembly and parent-owned Bindings.

## Complete every Block through a Composition

A Definition establishes the Model, Message, and optional OutMessage contracts and authors behavior through `init`, `update`, and Steps. A named Composition fixes the child Binding and Mount graph and authors the primary view. `toBlock` uses that same Composition to bring the implementation together and check handler completeness.

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

export const HomeComposition = Home.toComposition()

// view.ts
import { HomeComposition } from './definition'

export const view = HomeComposition.view((_model, h) => h.div([]))

// block.ts
import { HomeComposition } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = HomeComposition.toBlock({ init, update, view })

// index.ts
export { block } from './block'
export { Message, OutMessage } from './message'
export { Model } from './model'

// page/index.ts
export * as Home from './home'
```

Parents import the Home namespace from the parent barrel and bind `Home.block`.

`children` and `mounts` are independently optional. Use `toComposition()`, `toComposition({ children })`, `toComposition({ mounts })`, or `toComposition({ children, mounts })`. Omitted registrations grant no capabilities. Name the returned Composition, author the primary view through its `view` or `view.withInputs` method, and complete that same value. Direct `Definition.view` authoring is removed. A completed Block retains its distinct `view` helper for alternate embeds against its already fixed graph. Keep init, update, Steps, and operations required by child policy on the Definition.

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

The direct field form infers the parent Model and child Model relationship for exact `ChildModel` and `Option<ChildModel>` fields. Both forms keep the field name as their default placement. `None` makes an optional field absent, and a fold or exposed operation never creates it. Optionality does not require a placement override. Add `presentWhen` when parent policy gates that whole direct child. Use explicit `read` and `write` for tagged, nested, or custom storage. Foldkit compares decoded built-in Schema shapes; reuse the same Schema instance for an opaque declaration or keep custom accessors. Use `toParentMessage` for a custom wrapper. Do not pass a redundant Model Schema.

Placement identifies one child Binding within the parent's composition graph. It does not identify a DOM position and need not match a Model field. `readAll` selects the general keyed form and defaults placement to the child Block ID. Otherwise every `field` shorthand defaults to that field, including direct and wrapped keyed arrays; a static accessor config defaults to the child Block ID. For keyed Bindings, `key` identifies dynamic occurrences under that one placement. Supply an explicit placement only when sibling defaults collide or an established graph identity must deliberately remain different from the new default.

A split feature without a `composition/` directory uses `composition.ts` for straightforward Bindings, its complete `toComposition({ children, mounts })` registration, Composition and an optional owner-specific ViewBuilder alias. When `composition/` exists, `composition/composition.ts` owns that assembly and `composition/index.ts` exports it. Mount-only features use the same home, with definitions shared with the view in `mount.ts`. Extract a substantial policy to `composition/<child>.ts`; then `composition/composition.ts` remains the single assembly point and `composition/index.ts` is an explicit barrel. External consumers import from `composition.ts` or that barrel, never from a policy or assembly implementation path. The barrel exports each extracted policy as a child-named namespace, such as `Home` and `Room`. Consumers import `{ Home, Room }` from `./composition`. Keep flat named exports for the main Composition assembly surface and straightforward local Bindings. Name policy factories `bind`, so namespace callers use `Home.bind(...)`. Internal implementation modules may use direct relative sibling imports to avoid barrel cycles. A split graphless feature exports its named empty Composition beside the Definition in `definition.ts`; view and completion import that same value without an empty `composition.ts`. A compact graphless feature keeps it beside its cohesive implementation. When `composition/` exists, `composition/composition.ts` owns the root Bindings and complete graph and imports extracted policies from sibling modules; a compact root without `composition/` keeps that assembly in `application.ts`. `bindChild` only configures the relationship; including its result under `children` registers it. Neither step constructs Layers or starts effects. Import every extracted policy through its child-name namespace, such as `Home` or `Room`, so factories and constructed Binding values remain visibly grouped. Keep flat named imports for the main Composition assembly surface and straightforward local Bindings. Keep child feature namespaces distinct from parent-owned Binding policies.

The Binding projects `init`, `fold`, `embedView`, and operations selected under `expose`:

```ts
export const update = Application.update((model, message) =>
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

A keyed Binding uses the same parent-owned method. When a field is an array of child Models, a string-valued `key` names their stable identity field. This migration example retains the former general keyed Binding's Block-ID placement explicitly:

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

The child Schema must expose its declared Struct fields. Use the general keyed form for a union Model or a Schema without declared fields. The shorthand defaults placement to `field`; `placement: 'Row'` above deliberately preserves the previous general keyed default. The child Model returned by `init(key, ...)` must contain that key, and child folds and operations cannot change it. Parent update owns collection membership, so it replaces identity by removing one Model and adding another.

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

After, preserving the former general keyed Binding's `Applicant` placement:

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

`key` must name a required string or finite-number wrapper field, and `childField` must name a different required field whose Schema has exactly the same decoded shape as the child Model. The child Model may be a primitive or union because its identity stays on the wrapper. A child write replaces only the matching wrapper's child field, preserving its metadata, array position, and every unmatched wrapper reference. It does not insert a wrapper after parent update has removed that key. Placement defaults to `field`; `placement: 'Applicant'` above deliberately preserves the general keyed Binding's former Block-ID default.

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

import { Home } from './page'
import { Message } from './message'
import { Application } from './definition'
import { mounts } from './mount'

export { Application } from './definition'

export const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [home],
  mounts,
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
```

Then in the feature's helper module:

```ts
import type { Article } from './article'
import type { ApplicationViewBuilder } from './application'
import type { Model } from './model'

export const headerView = (h: ApplicationViewBuilder) =>
  h.header([], ['Articles'])

export const articleCard = (article: Article, h: ApplicationViewBuilder) =>
  h.article([], [article.title])

export const articleList = (model: Model, h: ApplicationViewBuilder) =>
  h.ul(
    [],
    model.articles.map(article => h.li([], [article.title])),
  )
```

`Block.ViewBuilderFor<typeof ApplicationComposition>` carries the root Message type plus its registered child and Mount capabilities. It is a type alias and constructs no runtime builder. Name the alias for its owner, declare it immediately after the Composition with no blank line, and export it only when another file uses it. The owner prefix identifies one Composition's capabilities at the plain import site. Structural contracts keep the standard names `Model`, `Message`, and `OutMessage` because they normally travel through the feature namespace. A helper takes only the Model, domain value, or context it actually reads; TypeScript infers one `Html` result or an array. Keep the framework's general `HtmlBuilder<Message>` for functions genuinely shared across owners.

## Rename the Composition view helper type

Replace `Block.HtmlBuilderOf` with `Block.ViewBuilderFor`. The argument is the Composition's type; the result retains its Message, registered child, and Mount capabilities for extracted view helpers. The underlying `HtmlBuilder` and view behavior are unchanged. The old public name is removed.

Before:

```ts
import type { Block } from 'foldkit'

import { SearchComposition } from './composition'

export type SearchViewBuilder = Block.HtmlBuilderOf<typeof SearchComposition>
```

After:

```ts
import type { Block } from 'foldkit'

import { SearchComposition } from './composition'

export type SearchViewBuilder = Block.ViewBuilderFor<typeof SearchComposition>
```

Use `Block.ViewBuilderFor` for both Block and Application Compositions. Keep owner-specific alias names such as `SearchViewBuilder` and `ApplicationViewBuilder`; define the alias immediately after the Composition when they share a file.

## Name and organize the final roles

Use `Foo`, `FooComposition`, and `block`. Use `Application`, `ApplicationComposition`, and lowercase `application` or `element` at the root.

- `definition.ts`: early Model, Message, OutMessage, and Block authoring contracts when split implementation files need them; for a graphless split feature, the named empty Composition also lives here.
- A folder-named implementation file, such as `workHistory/workHistory.ts`: substantial feature logic that does not warrant separate init/update/command files.
- `block.ts`: completed feature assembly.
- `composition.ts`: a split feature without `composition/`, with Bindings, complete child/Mount registration, Composition and optional owner-specific ViewBuilder alias. A substantial policy may use `composition/<child>.ts` with `composition/composition.ts` as assembly and an explicit barrel; external consumers import from the composition barrel rather than either implementation path. Mount-only features use the same home; graphless features need no empty scaffolding.
- `composition/composition.ts`: when `composition/` exists, the complete root graph, including straightforward Bindings. Import policy siblings directly inside the assembly module; external consumers import the explicit `composition/index.ts` barrel; external consumers do not deep-import `composition/<child>.ts` or `composition/composition.ts`. A compact root without `composition/` keeps this assembly in `application.ts`.
- `entry.ts`: container, startup inputs, completion, and Runtime startup.
- `services.ts`: root `ApplicationLayer` service providers.
- `layer.ts`: substantial or reused Layer composition at that directory boundary.

A compact root defines `Application` directly in `application.ts`. When split root Commands, Subscriptions, or child Bindings need that authoring value before Composition assembly, put its early contract in `definition.ts`. Those modules import the contract there; `application.ts` imports and re-exports `Application`. When `composition/` exists, `composition/composition.ts` imports `Application` and exports `ApplicationComposition`; a compact root without `composition/` may export both from `application.ts`. Entry completion still imports each implementation field from its real owner.

Keep final completion in `block.ts` when the view imports its Composition from `composition.ts` or, for a split graphless feature, `definition.ts`. The final assembly imports that same Composition and the view, so neither module depends on the completed Block. Do not create one file per API stage. Keep small examples compact. Use explicit barrels for intended feature contracts and import private implementations directly in tests.

`EffectsLayer` supplies implementations of declared Commands, Subscriptions, Mounts, ManagedResources, and Query Fetch Commands. `ApplicationLayer` supplies ordinary Services required by those handlers and startup Effects. Compose a small feature `EffectsLayer` in `block.ts`; use feature `layer.ts` when substantial. Compose root `ApplicationLayer` in `services.ts`, separate from browser startup in `entry.ts`.

## Complete the root through ApplicationComposition

Before:

```ts
// main.ts
import { Schema } from 'effect'
import { Runtime, type Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ count: Schema.Number })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ClickedIncrement: {} })
export type Message = typeof Message.Type

export const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  })

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: { count: 0 },
})

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: `Count: ${model.count}`,
  body: h.div(
    [],
    [
      h.p([], [`Count: ${model.count}`]),
      h.button([h.OnClick(Message.ClickedIncrement())], ['Increment']),
    ],
  ),
})

// entry.ts
import { Runtime } from 'foldkit'

import { Model, init, update, view } from './main'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
})

Runtime.run(application)
```

After:

```ts
// application.ts
import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ count: Schema.Number })

export const Message = defineMessageUnion({ ClickedIncrement: {} })

export const Application = defineApplication({ Model, Message })

export const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  }),
)

export const init = Application.init(() => ({ model: { count: 0 } }))

export const ApplicationComposition = Application.toComposition()

export const view = ApplicationComposition.view((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.div(
    [],
    [
      h.p([], [`Count: ${model.count}`]),
      h.button([h.OnClick(Message.ClickedIncrement())], ['Increment']),
    ],
  ),
}))

// entry.ts
import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'

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
