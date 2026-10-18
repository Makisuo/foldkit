---
'foldkit': minor
'@foldkit/ui': minor
'@foldkit/devtools': minor
'@foldkit/oxlint-plugin': minor
'create-foldkit-app': minor
---

Replace manual Submodel wiring with checked Definition → Composition → Block assembly and parent-owned Bindings.

## Complete every Block through a Composition

A Definition establishes the Model, Message, and optional OutMessage contracts and authors effects, Steps, lifecycle definitions, and child Bindings. A named Composition fixes the child Binding and Mount graph and owns init, update, and the primary view. `makeBlock` uses that same Composition to bring the implementation together and check handler completeness.

Define and complete a Block through explicit stages:

```ts
// definition.ts
import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const HomeDefinition = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})

// composition.ts
import { HomeDefinition } from './definition'

export const HomeComposition = HomeDefinition.makeComposition()

// view.ts
import { HomeComposition } from './composition'

export const view = HomeComposition.makeView((_model, h) => h.div([]))

// block.ts
import { HomeComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = HomeComposition.makeBlock({ init, update, view })

// index.ts
export { block } from './block'
export { Message, OutMessage } from './message'
export { Model } from './model'

// page/index.ts
export * as Home from './home'
```

Parents import the Home namespace from the parent barrel and bind `Home.block`.

`childBindings` and `mounts` are independently optional. Use `makeComposition()`, `makeComposition({ childBindings })`, `makeComposition({ mounts })`, or `makeComposition({ childBindings, mounts })`. Omitted registrations grant no capabilities. Name the returned Composition, author init, update, and the primary view through it, and complete that same value. Definitions do not author init, update, or view directly. A completed Block retains its distinct `makeView` helper for alternate embeds against its already fixed graph. Keep Steps and operations required by child policy on the Definition.

## Author through factory methods

`Definition.makeComposition` fixes the child and Mount graph. A Composition's `makeInit`, `makeUpdate`, and `makeView` methods author its implementation, and `makeBlock`, `makeApplication`, or `makeElement` completes that same graph. A completed Block uses `makeView` for an alternate embed view against its fixed graph.

Each `make*` method returns a configured value or an authored function. It does not run init, update the Model, render, construct Layers, or start effects. `makeApplication` and `makeElement` return passive runtime inputs; `Runtime.run`, `Runtime.hydrate`, and `Runtime.embed` execute them.

An authored update supports both call directions. Runtime dispatch uses `update(model, message, ...context)`. The curried `update(message)(model, ...context)` form is an internal Step with the same requirements, OutMessage type, and graph evidence. `Update.combine` accepts unary Steps, so supply required dispatch context through an explicit unary adapter before combining a contextual update.

Use the one-argument `Block.define('Feature')` form only for a generic factory that shares definitions before specializing several contracts with `.define(...)`. Ordinary features establish their contracts in the first call.

## Declare public operations

A public operation produces the Message and dispatch context for the Block's update. The completed Block passes that value through its update function synchronously as part of the pure transition; it does not enqueue another Runtime Message. The parent calls the Binding-projected operation and cannot bypass the child's update boundary.

Replace raw child Model helpers and parent field rewrites with a child-owned Message transition and a Binding operation:

```ts
// message.ts
import { defineMessageUnion } from 'foldkit/message'

export const Message = defineMessageUnion({
  RequestedReset: {},
})

// update.ts
import { modifyFields } from 'foldkit/struct'

import { SearchComposition } from './composition'
import { Message } from './message'

export const update = SearchComposition.makeUpdate((model, message) =>
  Message.match(message, {
    RequestedReset: () => ({
      model: modifyFields(model, { query: () => '' }),
    }),
  }),
)

// block.ts
import { SearchComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

export const block = SearchComposition.makeBlock({
  init,
  update,
  view,
  operations: { requestReset: Message.RequestedReset },
})
```

Put the local Message constructor directly under `operations` when its payload is the public input. Completion associates it with the Block's update without constructing a Message. TypeScript checks its Message shape. Completion also verifies exact constructor membership in the declared Message Schema; a same-shaped constructor from another union is rejected at runtime. Routed `Got*` wrappers remain Binding delivery. A constructor with payload fields gives the completed Block operation `(model, payload, ...context)`, with constructor defaults accepted. A constructor without payload fields gives `(model, ...context)` with no placeholder. The Binding method omits the child Model; a keyed Binding prepends its key. There is no separate `makeOperation` authoring helper.

Keep a tuple producer under `operations` when the public inputs need mapping, refinement, defaults, or an exact update context tuple. Inline tuples receive contextual typing. An extracted producer returns `Tuple.make(Message.RequestedReset())`, with `Tuple` imported from `effect`. Local Message constructors and tuple producers complete through the same execution path. The registry accepts these two Message-producing forms, not arbitrary Steps, and there is no `expose` compatibility alias.

Every completed operation uses the full return contract of the Block's update. If any update branch returns a Command or OutMessage, all operations carry that requirement or optional result in their type. Dispatching a Message for a pure branch does not run effects from another branch.

Keep the authored `update` in a named value before passing it to `makeBlock`, as shown above. The current overloads can misinfer a handler Layer when `makeUpdate` is nested directly in a completion record that also contains a view, operations, Subscriptions, and ManagedResources. The named form preserves exact inference without extra type annotations.

A raw Binding operation recipe exposes only channels produced directly by the child transition. Return it intact from the owning Composition callback. The Composition resolves registered OutMessage policy and sibling operations into the final parent Command Message, requirements, and OutMessage channels. Derive exported parent contracts from the Composition-authored update or completed Block.

Pair the operation and Message names: `informJoined` selects `Message.InformedOfJoin`, `informRouteChanged` selects `Message.InformedOfRouteChange`, and `requestCloseMenu` selects `Message.RequestedCloseMenu`. Notifications use `inform*`/`InformedOf*`; actions use `request*`/`Requested*`. Keep actual UI facts separate when their cause differs from the parent request. Selectors and derived view inputs remain ordinary helpers.

### Name Binding actions

Name action operations with `request*`, paired with `Requested*` Messages. For example, invoke `DialogBinding.requestOpen()` or `DialogBinding.requestClose()` through the registered Binding. Animation, Menu, Listbox, Combobox, DatePicker, Calendar, Toast, VirtualList, and Query Binding actions follow the same convention. Query uses `requestReset`, `requestRevalidation`, `requestRevalidationOrLoad`, and `requestLoadIfMissing`. Notification operations retain their `inform*` names and enter update through `InformedOf*` Messages. Custom tuple adapters follow the same naming rule.

### Bundle owned Subscription handlers

When all entries returned by `Definition.subscriptions(...)` have attached handlers, the registry exposes an aggregate `.layer`:

Individual recipes (still supported):

```ts
const EffectsLayer = Layer.mergeAll(
  subscriptions.pointerMoves.layer,
  subscriptions.keyboardPresses.layer,
)
```

All attached recipes in the owned registry:

```ts
const EffectsLayer = subscriptions.layer
```

The aggregate only merges passive recipes; it constructs no handlers or Streams. Its exact handler outputs, Service requirements, and constructor errors are preserved. An empty record supplies `Layer.empty`. A registry containing any host-provided contract has no aggregate `.layer`; supply that contract explicitly. The entry key `layer` is reserved and rejected by types and runtime validation. Individual entry Layers remain available for selective assembly. Standalone `Subscription.make` still returns an entry record without this owned aggregate.

## Move child integration to the parent

The parent authoring value creates the Binding because the parent owns Model access, Message mapping, OutMessage policy, and lifecycle policy:

```ts
import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Home } from './page'

export const ApplicationDefinition = defineApplication({ Model, Message })

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [HomeBinding],
})
```

The direct field form infers the parent Model and child Model relationship for exact `ChildModel` and `Option<ChildModel>` fields. Both forms keep the field name as their default placement. `None` makes an optional field absent, and a fold or operation never creates it. Optionality does not require a placement override. Add `presentWhen` when parent policy gates that whole direct child. Use explicit `read` and `write` for tagged, nested, or custom storage. Foldkit compares decoded built-in Schema shapes; reuse the same Schema instance for an opaque declaration or keep custom accessors. Use `toParentMessage` for a custom wrapper. Do not pass a redundant Model Schema.

Placement identifies one child Binding within the parent's composition graph. It does not identify a DOM position and need not match a Model field. `readAll` selects the general keyed form and defaults placement to the child Block ID. Otherwise every `field` shorthand defaults to that field, including direct and wrapped keyed arrays; a static accessor config defaults to the child Block ID. For keyed Bindings, `key` identifies dynamic occurrences under that one placement. Supply an explicit placement only when sibling defaults collide or an established graph identity must deliberately remain different from the new default.

A split feature without a `composition/` directory uses `composition.ts` for straightforward Bindings, its complete `makeComposition({ childBindings, mounts })` registration, Composition and an optional owner-specific ViewBuilder alias. When `composition/` exists, `composition/composition.ts` owns that assembly and `composition/index.ts` exports it. Mount-only features use the same home, with definitions shared with the view in `mount.ts`. Extract a substantial one-way policy to `composition/<child>.ts`; then `composition/composition.ts` remains the single assembly point and `composition/index.ts` is an explicit barrel. Assembly imports actual policy exports directly from sibling modules, and the barrel re-exports intended values such as `HomeBinding`, `RoomBinding`, and `ApplicationComposition`. External consumers import from `composition.ts` or that barrel, never from a policy or assembly implementation path. Use a factory only when Binding construction needs caller-owned configuration. Keep reciprocal sibling policies together in the same parent assembly and defer sibling Binding calls through policy callbacks; a callback may close over a Binding declared later without a circular import. Internal implementation modules may use direct relative sibling imports to avoid barrel cycles. This assembly module is also required for a split graphless feature; `definition.ts` contains contracts and `FooDefinition`, never a Composition or owner-specific ViewBuilder. A compact graphless feature keeps all stages beside its cohesive implementation. A genuinely compact root keeps Model, Message, init, update, view, `ApplicationDefinition`, and `ApplicationComposition` together in `application.ts`. A split root always uses `composition.ts` or `composition/composition.ts`, including when graphless, and removes the emptied `application.ts`. `bindChild` only configures the relationship; including its result under `childBindings` registers it. Neither step constructs Layers or starts effects.

The Binding projects `init`, `fold`, `embedView`, and operations selected under `operations`. A registered canonical wrapper Message routes through `fold` automatically, so the Composition update callback handles only parent-owned variants:

Canonical unkeyed wrappers route automatically only when child update has no context parameters. Declare `fromParentMessage.args` for optional or defaulted context too: the parent chooses the native fold arguments explicitly, including whether to use a child default. This restriction does not change direct Binding folds.

```ts
export const update = ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedRefresh: () => HomeBinding.refresh()(model),
  }),
)
```

Every inhabitable parent Message whose tag starts with `Got` is reserved for child delivery and must have exactly one owning Binding in the Composition. Composition routes the wrapper before the authored update callback. Remove manual `Got*` branches, including branches that inspect the wrapped child Message, and move parent reactions to `outMessage.fold`.

Register that route and its OutMessage policy on the Binding:

```ts
import { defineApplication, type Update } from 'foldkit'

import { Dialog } from './dialog'
import { Message } from './message'
import { Model } from './model'
import { resetSearch } from './search'

const ApplicationDefinition = defineApplication({ Model, Message })

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<typeof Model.Type, typeof Message.Type>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
  CompletedClose: () => resetSearch,
})

const DialogBinding = ApplicationDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [DialogBinding],
})

export const update = ApplicationComposition.makeUpdate()
```

Pass no callback when every parent Message is owned by registered child routing. Composition still returns the complete update function and routes each wrapper to its Binding.

Use the canonical `parentMessage` form when the wrapper contains only `{ message }` and the child fold takes no context. Custom, keyed, and contextful Bindings declare `toParentMessage` and `fromParentMessage` together. `fromParentMessage.parentMessage` names the exact wrapper constructor, and `args` returns `Option.some` of the Binding's native fold arguments or `Option.none()` for an inactive or stale occurrence. `fromParentMessage: false` is not supported and is rejected in JavaScript as well as TypeScript. A child whose Message type is `never` omits `parentMessage`, `toParentMessage`, and `fromParentMessage`.

For Dialog, `CompletedClose` is emitted when `CompletedCloseDialog` finishes cleanup. Fold it there when dependent state such as Search must reset after cleanup. The existing `Closed` transition keeps its earlier timing.

The recommended Oxlint preset adds `foldkit/no-manual-composition-routing`. It reports a `false` opt-out, unpaired inline custom mappings, manual `Got*` update handlers, and direct inspection of the wrapped child Message. The rule follows inline and top-level extracted callbacks and handler records in the same file. The missing-route diagnostic stays limited to inline configs without spreads, where the absence is certain.

`foldkit/no-direct-block-state-update` now also reports a `reflect*` helper used to change a registered child field from its parent. Replace that silent Model change with a child-owned `inform*` operation and an `InformedOf*` Message branch.

The parent configures OutMessage policy in its Binding. That policy executes during the pure child fold or operation:

parent update → child fold or operation → parent OutMessage handling → parent result

```ts
import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { openArticle } from './operation'
import { Home } from './page'

export const ApplicationDefinition = defineApplication({ Model, Message })

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedArticle: ({ articleId }) => openArticle(articleId),
})

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  outMessage: { fold: foldHomeOutMessage },
})
```

`outMessage.fold` handles variants locally. Add an exhaustive `outMessage.forward` only when at least one variant continues through the current Block's OutMessage. A derived OutMessage takes precedence over forwarding for the same dispatch; local handling still runs.

An OutMessage policy may call a parent Step or a registered sibling Binding operation. This supports parent-owned coordination in either direction between siblings. Composition validates the policy's output and the captured sibling evidence when the graph is registered. Keep policy chains synchronous and finite because a sibling operation may run another policy before the original update returns.

A keyed Binding uses the same parent-owned method. When a field is an array of child Models, a string-valued `key` names their stable identity field:

```ts
import { Option } from 'effect'
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Row } from './row'

const TableDefinition = Block.define('Table', { Model, Message })

export const RowsBinding = TableDefinition.bindChild(Row.block, {
  field: 'rows',
  key: 'id',
  toParentMessage: (rowId, message) =>
    Message.GotRowMessage({ rowId, message }),
  fromParentMessage: {
    parentMessage: Message.GotRowMessage,
    args: (_model, { rowId, message }) => Option.some([rowId, message]),
  },
})

export const TableComposition = TableDefinition.makeComposition({
  childBindings: [RowsBinding],
})
```

The child Schema must expose its declared Struct fields. Use the general keyed form for a union Model or a Schema without declared fields. The shorthand defaults placement to `field`. The child Model returned by `init(key, ...)` must contain that key, and child folds and operations cannot change it. Parent update owns collection membership, so it replaces identity by removing one Model and adding another.

A required `Schema.Array` field on a parent Struct can store closed Struct wrappers around child Models. Add `childField` when `key` belongs to the wrapper.

Configure the wrapper field on the parent-owned Binding:

```ts
import { Option } from 'effect'

export const ApplicantsBinding = ApplicationDefinition.bindChild(
  Applicant.block,
  {
    field: 'applicants',
    key: 'id',
    childField: 'entry',
    toParentMessage: (applicantId, message) =>
      Message.GotApplicantMessage({ applicantId, message }),
    fromParentMessage: {
      parentMessage: Message.GotApplicantMessage,
      args: (_model, { applicantId, message }) =>
        Option.some([applicantId, message]),
    },
  },
)
```

`key` must name a required string or finite-number wrapper field, and `childField` must name a different required field whose Schema has exactly the same decoded shape as the child Model. The child Model may be a primitive or union because its identity stays on the wrapper. A child write replaces only the matching wrapper's child field, preserving its metadata, array position, and every unmatched wrapper reference. It does not insert a wrapper after parent update has removed that key. Placement defaults to `field`.

Use `readAll`, function-valued `key`, `read`, and `writeAt` for custom parent writes, opaque, union, or open/index-signature wrappers, and collections such as `Option<RoomInstance>` that enumerate zero or one child. These explicit accessors continue to define application-specific storage and enumeration policy.

Use a keyed Binding for a routed child when its domain ID changes, even if only one instance is present at a time. Capture the key in `toParentMessage` so delayed Command results and Subscription emissions retain their origin, and recover the native fold tuple through `fromParentMessage`. Return `Option.none()` when the key is stale or inactive. Replacing the key retires that occurrence and its dispatchers; reusing the key later creates a new occurrence. Running Commands retain application lifetime, so isolate external writes by domain ID when their completion must not overwrite another instance's data.

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

export const ApplicationDefinition = defineApplication({ Model, Message })

export const PostsBinding = ApplicationDefinition.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [PostsBinding],
})
```

Query preserves `Model`, `Message`, `Fetch`, direct `read` and `run`, cache generations, stale response protection, loading, refresh and reset operations, cache key typing, and precise handler constructor error and Service requirements. A canonical handler contributes `query.EffectsLayer`. A host-owned Query omits `handler`, lists the unresolved Fetch contract on its Block, and is completed with `query.provideHandlers(query.toLayer(...))` before binding.

## Use plain feature-local view helpers

The canonical owned view uses `Composition.makeView` or `makeView.withInputs`. Ordinary feature-local helpers are plain functions with purposeful parameters.

Keep the early root contract separate when child Bindings import its helpers:

```ts
// definition.ts
import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const ApplicationDefinition = defineApplication({ Model, Message })

// composition.ts
import type { Block } from 'foldkit'

import { Home } from './page'
import { Message } from './message'
import { ApplicationDefinition } from './definition'
import { mounts } from './mount'

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [HomeBinding],
  mounts,
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
```

Then in the feature's helper module:

```ts
import type { Article } from './article'
import type { ApplicationViewBuilder } from './composition'
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

## Name the Composition view helper type

Use `Block.ViewBuilderFor<typeof Composition>` to retain a Composition's Message, registered child, and Mount capabilities for extracted view helpers:

```ts
import type { Block } from 'foldkit'

import { SearchComposition } from './composition'

export type SearchViewBuilder = Block.ViewBuilderFor<typeof SearchComposition>
```

Use `Block.ViewBuilderFor` for both Block and Application Compositions. Keep owner-specific alias names such as `SearchViewBuilder` and `ApplicationViewBuilder`; define the alias immediately after the Composition when they share a file.

## Name and organize the final roles

Use `FooDefinition`, `FooComposition`, and `block`. Use `ApplicationDefinition`, `ApplicationComposition`, and lowercase `application` or `element` at the root. Preserve the runtime name in `Block.define('Foo', ...)`.

- `definition.ts`: early Model, Message, OutMessage, and Block authoring contracts when split implementation files need them. It exports `FooDefinition`, never a Composition or owner-specific ViewBuilder.
- A folder-named implementation file, such as `workHistory/workHistory.ts`: substantial feature logic that does not warrant separate init/update/command files.
- `block.ts`: completed feature assembly.
- `composition.ts`: a split feature without `composition/`, with Bindings, complete child/Mount registration, Composition and optional owner-specific ViewBuilder alias. A substantial one-way policy may use `composition/<child>.ts` with `composition/composition.ts` as assembly and an explicit barrel; reciprocal sibling policies stay together in that assembly and defer sibling calls through policy callbacks. External consumers import from the composition barrel rather than either implementation path. Mount-only and graphless split features use the same home. A split root uses `composition.ts` even when graphless.
- `composition/composition.ts`: the complete root graph when substantial policies need a directory, including straightforward Bindings, reciprocal policies, and OutMessage folds. Import one-way policy siblings directly inside the assembly module; external consumers import the explicit `composition/index.ts` barrel; external consumers do not deep-import `composition/<child>.ts` or `composition/composition.ts`.
- `entry.ts`: container, startup inputs, completion, and Runtime startup.
- `services.ts`: root `ApplicationLayer` service providers.
- `command.ts`: root Command definitions and a small root `EffectsLayer`.
- `layer.ts`: substantial or reused Layer composition at that directory boundary.

A genuinely compact root defines Model, Message, init, update, view, `ApplicationDefinition`, and `ApplicationComposition` together in `application.ts`. Once any root responsibility is extracted, put `ApplicationDefinition` in `definition.ts`, the complete graph and `ApplicationComposition` in `composition.ts` or `composition/composition.ts`, and every standard implementation in its named file. Remove the emptied `application.ts` instead of retaining a partial implementation or re-export barrel. Composition imports the Definition and child or Mount declarations, never root init, update, or view. Entry completion imports each implementation field from its real owner.

Keep final completion in `block.ts` when the view imports its Composition from `composition.ts`. The final assembly imports that same Composition and the view, so neither module depends on the completed Block. Do not create one file per API stage. Keep small examples compact. Use explicit barrels for intended feature contracts and import private implementations directly in tests.

`EffectsLayer` supplies implementations of declared Commands, Subscriptions, Mounts, ManagedResources, and Query Fetch Commands. `ApplicationLayer` supplies ordinary Services required by those handlers and startup Effects. Compose a small feature `EffectsLayer` in `block.ts`; use feature `layer.ts` when substantial. Keep a simple root `EffectsLayer` with its Command definitions in `command.ts`; use root `layer.ts` only when the composition is substantial or reused. Compose root `ApplicationLayer` in `services.ts`, separate from browser startup in `entry.ts`.

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

export const ApplicationDefinition = defineApplication({ Model, Message })

export const ApplicationComposition = ApplicationDefinition.makeComposition()

export const update = ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  }),
)

export const init = ApplicationComposition.makeInit(() => ({
  model: { count: 0 },
}))

export const view = ApplicationComposition.makeView((model, h) => ({
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

const application = ApplicationComposition.makeApplication({
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

import { ApplicationComposition } from './composition'
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

TypeScript checks contracts, precise handler and Service requirements, constructor errors, handler completeness, operation requirements, and Mount or child capabilities through emitted declarations. Connected Binding folds and Binding-projected operations require the registering Composition's graph capability on their Model input. `makeUpdate` and startup processing supply that capability contextually. The capability is type-only and adds no domain Model or Schema field. A plain Model helper cannot invoke it.

`Binding.init({ args, key?, toParentModel, commands? })` returns a passive, noncallable initialization recipe with no result fields. Return it directly from `Composition.makeInit` or a Definition-owned Step; those boundaries interpret it under the registered graph and produce the complete parent result. Ordinary Model construction remains available.

Runtime composition-frame guards continue to protect erased JavaScript and operations captured for later execution. Runtime identity maps and lifecycle generations enforce exact occurrence identity, stale Command and callback suppression, keyed generation isolation, Mount ownership, and the private identity of structurally identical handler protocols. These are runtime guarantees rather than type-level proofs.

Lint rules enforce repository naming and architectural conventions such as authoring and Composition value names and avoiding direct child state updates. File names, narrow barrels, section heading restraint, and the distinction between substantial and small Layer modules remain review conventions.
