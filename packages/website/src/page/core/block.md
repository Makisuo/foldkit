# Block

## Overview

Build applications from Blocks. Fold their updates into a single application Model.

A Block packages a composable part of a Foldkit application: its Model, Messages, init and update, optional view, lifecycle effects, handler recipes, and public operations. Its parent binds it to the parent Model, drives its public API, and handles its OutMessages.

The Block itself has three stages:

1. Create a Definition for the Block's contracts and behavior.
2. Create a named Composition for its child and Mount graph and primary view.
3. Complete that same Composition with `toBlock`.

After completion, a parent can bind the Block. The root follows the same Definition and Composition stages, then completes its Composition as a passive runtime input.

Definition, Composition, Block production, Binding, and Application completion are passive configuration. The Runtime constructs Layers and performs effects only after `Runtime.run`, `Runtime.hydrate`, or `Runtime.embed` starts that input.

That one Binding replaces repeated wiring across update, view, Subscriptions, ManagedResources, Mounts, and Effect Layers. The parent still owns application policy: where the child Model lives, when an optional child exists, how OutMessages affect the parent, which routes activate Subscriptions, initialization order, and where the child renders.

:::Info{label="Complete application"}
The [Typing Terminal application](/example-apps/typing-terminal) composes Home and Room as Blocks. Its [client source](https://github.com/foldkit/foldkit/tree/main/packages/typing-game/client/src) shows Definitions split across files, parent Bindings, route gates, OutMessages, and root service provision.
:::

## When to Create a Block

Use a Block when part of the application owns a state machine rather than only markup. Common reasons are:

- A reusable component owns interaction state, keyboard behavior, focus, or accessibility wiring.
- A feature area owns enough Model and Message variants that its update loop should be separate.
- A feature owns Commands or lifecycle work that should travel with its state and update boundary.

If a section only renders parent state, use a view function. A card that receives a title and content does not need its own Block.

## Define a Block {#child-block}

### Establish the feature boundary

Declare the Schemas, then call `Block.define('Settings', { Model, Message, OutMessage })`. This creates the local identity and typed authoring helpers together. The ID is local to the feature; do not include ancestors or filesystem paths. Name the returned value `Settings`; export the completed Block as `block`, and name the graph-aware value `SettingsComposition`.

::Snippet{name="blockDefinition" label="Defining a typed Block"}

The returned Definition supplies `command`, `mount`, `mountStream`, `resource`, `init`, `update`, `step`, `subscriptions`, and `managedResources`. Author init as `Settings.init(fn)`. The helper checks its Model and Command result Messages while preserving the function's exact arguments, return type, requirements, and child registration evidence. It provides the owning identity and precise contextual types. Completion uses the preserved evidence to validate the final child and handler graph. Keep this value in one module and import it; creating another definition with the same readable ID does not reuse the original definition.

`Settings.init` accepts one concrete function signature, including optional, default, and rest parameters. Adapt an overloaded helper or callable object with a concretely typed callback. A generic Block factory captures its type parameters outside the initializer instead of making the initializer generic.

Commands and lifecycle handlers declare local names such as `SaveTheme`. Foldkit derives the full runtime path from composition. Settings connected under Profile becomes `Profile/Settings/SaveTheme`; the feature remains reusable under another parent.

### Define the Composition

Call `toComposition({ children, mounts })` after defining the child Bindings and parent policies. Name the returned value `<Feature>Composition`. It fixes that graph and supplies the capabilities available while authoring the primary view and producing the Block. Both fields are optional and default to empty collections.

Keep the Definition and Composition as separate named values. Author behavior such as update and public Steps through `Settings`, define its child Bindings and policies, then create `SettingsComposition`. Author the primary view through `SettingsComposition.view` or `view.withInputs`. This ordering also breaks the inference cycle between a parent Step, the child policy that uses it, and the graph containing that policy.

Features without children or Mounts still call `toComposition()`. Composition configures capabilities; it does not build Layers or start child behavior.

### Produce the completed Block

Call `toBlock` after the feature's pieces exist. It packages the authored pieces into a checked Block without building a Layer, running init, or starting lifecycle work. A completed Block may still carry ordinary Service requirements or handlers that its host must provide.

::Snippet{name="blockSettings" label="Producing a completed Block"}

Export the completed value as `block`. Parents import the feature namespace and bind it through their own Definition.

`EffectsLayer` contains only the feature's local handler recipes. Omit it when the feature has no local handlers; Foldkit uses an empty recipe and still checks completeness. Child Bindings contribute their complete recipes automatically. A handler Layer may require an HTTP client, store, RPC client, clock, or browser service. Those ordinary Service requirements continue through composition until the application root supplies them.

### Multi-file organization

Organize files by responsibility. A split feature can keep its typed authoring declaration in `definition.ts`, then produce the completed value in `block.ts`:

```text
settings/
├── definition.ts    # typed authoring definition
├── model.ts
├── message.ts
├── update.ts        # Commands live beside the update that returns them
├── view.ts
├── block.ts         # completed Block and local EffectsLayer
└── index.ts         # explicit public barrel
```

Keep small features together. In a split feature with children or Mounts, `composition.ts` owns child Bindings, the complete `children` and `mounts` lists passed to `toComposition`, the feature's Composition, and its optional owner-specific ViewBuilder alias such as `SettingsViewBuilder`. A Mount-only feature uses the same file. A split graphless feature exports its named empty Composition beside the Definition in `definition.ts`; `view.ts` and `block.ts` import that same value. A compact graphless feature keeps the named Composition beside its cohesive implementation. Extract a substantial child policy to `composition/<child>.ts`; then `composition/composition.ts` remains the single assembly point and `composition/index.ts` is an explicit barrel. Straightforward Bindings stay beside `toComposition`. Extract `layer.ts` for a substantial or reused local handler bundle.

Keep `definition.ts` focused on early contracts needed by implementation files, plus the empty Composition when a split feature is graphless. Substantial behavior belongs in `init.ts`, `update.ts`, or a folder-named implementation file such as `workHistory/workHistory.ts`. Views import their Composition and Bindings from the assembly module; final `block.ts` imports that same Composition and the implementation pieces. Composition must not import the primary view, update matcher, or completed Block. Put shared Mount definitions in `mount.ts` so Composition and view can import them without a cycle. Root `application.ts` assembles its complete graph and root-local handlers; `entry.ts` completes and runs it.

A split root may need an early `definition.ts` so its Commands and child Bindings can import `Application` without loading the Composition that depends on them. Root `application.ts` imports and re-exports that contract and assembles `ApplicationComposition`. See [Project Organization](/patterns/project-organization) for the complete file and barrel conventions.

Export `block` and the intended structural pieces from the feature barrel. Export the feature as a namespace from the parent barrel. The namespace supplies context for `Settings.Model`, `Settings.Message`, and `Settings.OutMessage.match`:

::Snippet{name="blockFeatureExports" label="Exporting a completed feature"}

## Bind a Child {#embedding}

Call the parent Definition's `bindChild` method with the completed child Block. The Binding records the child's placement in the parent Model and Message context.

::Snippet{name="blockProfile" label="Binding and embedding a Block"}

For a child stored directly in an exact Struct field, pass `field` instead of read/write functions. The field may hold the child Model itself or `Option<ChildModel>`. Both forms use the field name as their default placement. An Option field makes the child absent while it is `None`; a fold or exposed operation does not create a missing child. The parent Definition already establishes the parent Model. Use `parentMessage: Message.GotSettingsMessage` when the wrapper contains only `{ message }`; Foldkit constructs that parent Message for every child Message, including Command results and lifecycle emissions. Use `toParentMessage` for custom mappings, and supply exactly one mapping field.

Foldkit validates direct storage from the decoded Schema shape. Reuse the same Schema instance when the child Model uses an opaque declaration. Use explicit `read` and `write` when parent storage deliberately uses another opaque declaration whose decoded shape cannot be compared.

Placement defaults to `field` for this shorthand and to the child's Block ID for accessor Bindings. An explicit `placement` overrides either default. Two different fields therefore identify two different occurrences. Keep an override when composition identity should differ from storage location:

::Snippet{name="blockStaticPlacements" label="Binding two static placements"}

`bindChild` only configures the parent-child relationship. Register each selected Binding in the parent's Composition; this declaration still constructs no Layers and starts no effects:

::Snippet{name="blockRegisterChildren" label="Composing child Bindings"}

The Composition lets Foldkit collect child handler recipes and lifecycle definitions, validate embedded views, derive qualified effect identities, and manage active occurrences.

### Fold child Messages {#fold-child}

Use `binding.fold(model, message, ...context)` in the wrapper Message handler. It runs the child's update, writes the next child Model, lifts Commands back to the parent Message type, and applies the Binding's OutMessage policy.

::Snippet{name="blockFoldChild" label="Folding a bound child Message"}

Declare parent-driven operations under `expose`, then call them directly through the Binding. Forward received child Messages through `fold`; use named operations for changes the parent initiates:

::Snippet{name="blockProjectedSteps" label="Calling a bound public operation"}

These calls are pure. They produce parent Update.Steps containing the next Model, optional Commands, and optional OutMessage. The Runtime executes returned Commands later. Every public operation receives the same read/write, absence, Command lifting, resource access, and OutMessage guarantees as `fold`.

Delegating an operation to update can share behavior. Use a truthful Message such as `RequestedClose`; a programmatic close did not click a button. A direct pure Step or shared pure helper is also valid. Do not invent a Message only to route through update. Omit `expose` when the Block exposes no named operations.

Binding operations retain the exact argument types, Command requirements, and OutMessage behavior of the child operation.

### Initialize the child

The parent decides how several initial Models combine. Call `binding.init(...args)`, put its Model into the parent Model, and retain its lifted Commands.

::Snippet{name="blockFoldChildInit" label="Initializing a connected child"}

Block init cannot emit an OutMessage. Author it through the Block Definition, then pass that same `init` function to `FeatureComposition.toBlock`. Composition owns graph-aware view authoring and completion; it has no `init` method. An optional `boot` helper is an ordinary initial Step applied through the Binding after the child Model exists; Foldkit has no special Runtime boot phase, and a feature need not define both init and `boot` helpers. When an existing domain operation such as `restore` or `open` already describes the transition, expose that Step instead. The same operation may run later from update. Do not create a Message only to trigger startup behavior.

The Binding's `outMessage.fold` policy can handle a fact from that initial Step against the complete parent Model. Parent init cannot forward an OutMessage, so a startup Step used there must finish with a plain update result.

### Embed the child view {#wiring-the-view}

`binding.embedView` supplies the canonical view, the Message wrapper, the composition identity, and the Binding's Mount evidence. Pass its result to `h.block`:

::Snippet{name="blockParentView" label="Embedding a connected child view"}

`slotId` identifies one render position inside the current view boundary. Keep it stable. The parent still supplies the child Model explicitly, which keeps rendering a pure function of the parent Model.

For per-render data owned by the parent, define the child view with the owning `view.withInputs<ViewInputs>` helper and pass `viewInputs` through the `embedView` call.

::Snippet{name="blockChildViewInputs" label="Defining a view with inputs"}

::Snippet{name="blockParentViewInputs" label="Embedding a view with inputs"}

The Model owns persistent state. `viewInputs` carries render-only data and callbacks selected by the parent.

## Callback Dispatch Boundaries

A child view builds handlers for the child's Message union. A top-level callback in `viewInputs`, such as `toView`, runs in the parent's boundary. Handlers built by that callback reach the parent update directly. Foldkit preserves that boundary when the child invokes the callback.

Keep callbacks at the top level of `viewInputs`. A function nested inside a plain object or array is rejected during view construction because Foldkit cannot infer which boundary should own it.

### Publish child attributes {#child-attributes}

A headless Block may supply behavior while its parent chooses the markup. The child builds attribute groups with `childAttributes` before passing them to `toView`. Each group retains the child's dispatcher and any Mount requirements.

::Snippet{name="blockChildAttributesPublish" label="Publishing child attributes"}

The parent spreads those groups onto its own elements. Child handlers still reach the child update through the Binding's Message wrapper; parent handlers built alongside them reach the parent update.

::Snippet{name="blockChildAttributesConsume" label="Rendering child attributes"}

Block authors call `childAttributes`; consumers spread the supplied groups. Stateless render helpers such as Button already use the caller's builder and Message type, so they do not establish a child boundary or need this wrapper.

### Share parent renderers

Build shared renderers in the parent and pass them as top-level `viewInputs` callbacks. A renderer can embed a sibling Block through that sibling's Binding. Each embed then establishes its own child boundary.

Thread `h` through view functions and render callbacks. Do not store a builder in module state; its dispatch context belongs to the current render boundary.

## Optional Children

An exact `Option<ChildModel>` field declares an optional child without a manual accessor. When the field is `None`:

- connected folds leave the parent Model unchanged;
- that occurrence's Subscription Streams stop;
- its ManagedResource handles release;
- its mounted elements clean up.

When the child reappears, Foldkit creates a new occurrence with new lifecycle scopes. A Command already running for the old occurrence keeps application lifetime, but its result is discarded if that occurrence is no longer current. This preserves Command interruption semantics while preventing a stale result from updating a replacement child.

Use `presentWhen` with a direct field when parent policy controls the whole child's presence independently of storage. The predicate applies to folds, exposed operations, Subscriptions, ManagedResources, and Mounts. A false result behaves like an absent Option field and never clears or replaces the stored child Model.

::Snippet{name="blockPresenceGate" label="Gating a child occurrence"}

Use explicit `read` and `write` for nested storage, tagged parent variants, or a custom write that updates more than the child field. The accessor's `None` result already determines presence, so accessor Bindings do not also take `presentWhen`.

Resource cleanup owns work that requires a live resource handle. See [operations using a handle](/core/managed-resources#operations-using-a-handle) for coordinating that lifetime with a running Command.

Use `subscriptions.when` when only child Streams need additional activation policy while the child remains present:

::Snippet{name="blockSubscriptionGate" label="Gating a child Subscription"}

The gate controls Streams. It does not remove the child or disable its update.

## OutMessages {#surfacing-facts}

A child reports facts to its parent through an OutMessage. Every Binding for a Block with OutMessages must declare an explicit policy.

- `outMessage.fold` handles the fact in the current parent and returns a parent Step.
- `outMessage.forward` translates selected facts into the current Block's own OutMessage.
- A Binding may do both. A derived OutMessage from the local fold takes precedence for that dispatch.

Build an OutMessage fold directly from the child's exhaustive matcher:

::Snippet{name="blockOutMessagePolicy" label="Handling a child OutMessage"}

The child does not know who embeds it. The parent decides what the reported fact means at that boundary.

The parent configures integration policy in its child Binding. That policy executes during the pure child fold or exposed operation. The flow is parent update → child fold or operation → parent OutMessage handling → parent result. Keep a substantial policy in a named parent fold beside that child's Binding, extracting both to `composition/<child>.ts` when the policy becomes substantial. An OutMessage fold receives `FoldContext` when it needs to lift a child Command or compare the transition with parent state from before the child update. `modelBeforeUpdate` is that previous parent Model. The Step returned by the fold still receives the parent Model after the next child Model has been written, so policy can deliberately use either side of the transition without reconstructing the fold by hand.

## Keyed Collections {#fold-child-at}

When a parent field is an array of child Models and each child has its stable key in a direct field, pass both field names:

::Snippet{name="blockDirectCollection" label="Binding a direct child collection" class="mb-4"}

This shorthand requires a child Model Schema that exposes Struct fields. Use the general keyed form for union, suspended, or other Schema declarations whose fields are opaque, even when every decoded variant has the same key field.

When each array item wraps the child Model, add `childField`:

::Snippet{name="blockMultipleInstances" label="Binding a wrapped child collection" class="mb-4"}

This form requires an exact parent Struct whose `field` is a required `Schema.Array` of closed Struct wrapper records. `key` must name a required string or finite-number field on each wrapper. `childField` must name a different required field whose Schema has exactly the same decoded shape as the child Model. The child Model itself may be a primitive or union because the wrapper owns the key. Placement defaults to `field`.

When Foldkit writes a child result, it replaces only `childField` in the matching wrapper. It preserves array order, wrapper metadata, and every unmatched wrapper reference. If the key has been removed, it leaves the array unchanged instead of inserting a wrapper.

Use the general keyed form when the parent or wrapper Schema is opaque, wrappers are a union or use open/index-signature storage such as `Schema.StructWithRest`, the collection is derived from a zero-or-one `Option<RoomInstance>`, or writing a child requires other parent changes. `readAll` enumerates the items, `key` selects stable identity, `read` selects the child Model, and `writeAt` stores its next value.

Each active key gets independent Subscription, ManagedResource, and Mount scopes. `fold`, exposed operations, `init`, and `embedView` take the key first. The key must be a stable string or finite number and must be unique in the current collection.

Removing a key synchronously makes its dispatchers stale and starts lifecycle cleanup. Reusing the same key later creates a new occurrence; results and callbacks captured by the earlier occurrence cannot update it.

Keyed Bindings do not reconcile the collection itself. Application update remains responsible for adding, removing, and ordering items in the parent Model. In the direct child array form, `init(key, ...)` must return a child Model with that key, and a child fold or operation cannot change it. In the wrapped array form, the wrapper key stays fixed while child folds and operations replace only the child field. The parent changes occurrence identity by removing one item and adding another under its own update logic.

A keyed Binding can also represent one optional child whose domain identity changes. Enumerate zero or one item from an `Option`, and store its ID beside the child Model.

For example, in [Typing Terminal](/example-apps/typing-terminal), the Room Binding captures `roomId` in `GotRoomMessage` for views, Command results, and Subscription emissions. Navigating to another room replaces the keyed occurrence and initializes a fresh Room Model. A delayed result keeps its original room ID; the parent does not infer its origin from the current Route. Local child Messages such as `ChangedUserText` need no additional room ID.

Discarding a Command result does not undo its external writes. Scope persistent data by the same domain ID when a completed write from one occurrence must not overwrite another occurrence's data.

## Reading Parent State

The child Model should contain state the child owns. Parent-owned values can cross the boundary in two explicit ways.

Pass per-dispatch context after the child Message:

::Snippet{name="blockParentStateInUpdate" label="Parent context in child update" class="mb-4"}

Pass render-only values through `viewInputs`:

::Snippet{name="blockParentStateInView" label="Parent state through view inputs" class="mb-4"}

If a value must survive independently or drive future child transitions, put it in the child Model through a child-owned Step.

## Reflect External State {#reflecting-external-state}

Sometimes another source is authoritative: the URL may own filter bounds, or a form library may own the current field value. A child can expose a pure `reflect*` helper that returns only its next Model. The parent uses it while handling the source's Message.

::Snippet{name="blockReflectExternalState" label="Reflecting URL state into a child"}

Use reflection only for silent synchronization. If the transition should emit Commands or an OutMessage, expose a public Step and call it through the Binding.

## Complete the Application

Import `defineApplication` from `foldkit` and export the early typed value as `Application`. Its owned methods author root Commands, updates, Steps, and lifecycle declarations. Create `ApplicationComposition` with the root child Bindings and Mounts, author the primary view through that Composition, then call its `toApplication` or `toElement` in `entry.ts` with explicitly listed implementation pieces and browser inputs. A graphless root still calls `Application.toComposition()`. An Application cannot be bound as a child:

Root `services.ts` supplies the shared store required by the child handler:

::Snippet{name="blockApplicationServices" label="Application settings provider"}

The entry completes and starts the Application:

::Snippet{name="blockApplicationCompletion" label="Completing the Application"}

The Application Composition carries the child graph. Its completion config supplies local handler recipes and lifecycle definitions. `ApplicationLayer` supplies ordinary application services. It does not re-merge each feature's `EffectsLayer`.

`ApplicationComposition.toApplication` validates the concrete composition before the Runtime starts. Missing handlers, incompatible child Bindings, and unavailable Mount requirements fail before a user interaction.

Server rendering uses the same root:

::Snippet{name="blockServerRender" label="Rendering the Application on the server"}

The server runs init and view. It does not construct browser handler Layers or start lifecycle work.

## Select a Handler Recipe {#select-a-local-handler-recipe}

The canonical `block` includes the feature's attached handlers. Most tests should keep them and replace their underlying service Layers. This exercises the same mapping, retry, error, and Message policy as production.

When a host intentionally replaces the feature's handlers as a group, call `replaceEffectsLayer` before connecting it:

::Snippet{name="blockEffectsLayerSelection" label="Selecting a feature handler recipe"}

Use the original definitions' `toLayer` methods so the alternate providers retain the same contracts and runtime identities. The selected recipe replaces the feature's local recipe and retains its child recipes. The unselected recipe is never built.

Whole-handler replacement is useful for a host-owned feature contract, a deliberately simulated demo environment, or focused Runtime orchestration tests. It is a secondary seam; service replacement is the usual application-testing boundary.

## Generic Blocks

A reusable factory can refine a completed Block with a Schema while sharing one identity and one local handler recipe. For this specialized case, `Block.define('Combobox')` establishes the identity and primitive methods before the single/multi and generic item contracts exist. Its `.define({ Model, Message, OutMessage })` method then establishes each typed contract under that same identity. Ordinary features use the two-argument form.

::Snippet{name="blockGenericFactory" label="Schema-refined Block"}

Keep the shared identity and recipe at module scope. Factory calls may refine Model, Message, OutMessage, view inputs, and public operation payloads. They must not manufacture new effect identities for the same reusable component.

## Lifetimes

Composition preserves the owner of each effect lifetime:

| Lifetime                    | Owner                                            |
| --------------------------- | ------------------------------------------------ |
| One application start       | Handler constructors and shared service Layers   |
| One Command invocation      | The returned Command handler                     |
| One active Block occurrence | Subscription Streams and ManagedResource handles |
| One mounted element         | Mount acquisition and cleanup                    |

Connecting a Block does not build a Layer. The Runtime builds the selected handler graph once, then starts and stops occurrence work as the Model changes.

## Never Bypass the Child's Update {#never-bypass-the-update}

The parent stores the child Model but does not own its transitions. Do not reach into the child Model with `modifyFields`.

::Snippet{name="blockDirectModifyFieldsAntipattern" label="❌ Resetting child state directly"}

Expose a named operation under `expose` and call it through the Binding:

::Snippet{name="blockDelegateViaHelper" label="✅ Resetting child state through a connected Step"}

This preserves invariants, Commands, OutMessages, effect requirements, and the child's freedom to change its Model shape.

## Boundary Identity and Model Identity {#boundary-id-and-model-identity}

A Block Definition identifies a reusable feature. A Binding identifies one placement in its parent. `slotId` identifies one render position, and a keyed Binding's key identifies one dynamic occurrence. These values serve different jobs and should all remain stable.

The child Model may have its own domain ID. Foldkit does not infer runtime placement from that field. State identity and composition identity often coincide, but keeping the relationship explicit avoids hidden routing rules.

## Debugging in DevTools

Name wrapper Messages `Got<Child>Message`. DevTools uses that convention to group nested Message paths. Effect names come from the derived composition path, so repeated placements and keyed occurrences remain distinguishable while local definitions keep short names.

## API

### Block.define

`Block.define(id, { Model, Message, OutMessage? })` creates a local identity and typed behavior authoring methods, including `init`. `id` is a nonempty segment without `/` or `::`. Name the returned value `<Id>`, such as `Settings` for the ID `Settings`. Name the result of `toComposition({ mounts?, children? })` `<Id>Composition`; it adds the primary view and completion capabilities for that fixed graph, without copying the Definition-only `init` helper.

For shared definitions specialized by a generic factory, `Block.define(id)` supplies the primitive methods and `.define(contracts)` establishes each later typed contract. Both forms are passive configuration.

### Feature.toComposition

`Feature.toComposition({ children?, mounts? })` checks the composition graph and returns `FeatureComposition`. Omitted children and Mounts default to empty collections without granting their capabilities.

### FeatureComposition.toBlock

`FeatureComposition.toBlock({ init, update, view?, expose?, subscriptions?, managedResources?, EffectsLayer?, hostHandlers? })` checks and returns the passive completed Block. `EffectsLayer` may require ordinary Services supplied by `application.provide(ApplicationLayer)`. `hostHandlers` explicitly declares contracts left to the host. Complete those Blocks with their own `provideHandlers(...)` before binding them into a runnable application; final Application completion rejects unresolved child handlers.

### Parent.bindChild

`Parent.bindChild(block, config)` creates one static, optional, or keyed Binding in the established parent Model and Message context. Use `field` for an exact direct Struct field containing the child Model or `Option<ChildModel>`; `presentWhen` can add whole-child presence policy to that direct form. Use explicit `read`/`write` for custom access. A direct child-Model array uses string-valued `field` and `key` when the child Model Schema exposes Struct fields. A required `Schema.Array` field on a parent Struct containing closed wrappers adds a distinct `childField`; its key is a required string or finite-number wrapper field, while `childField` is a required field with exactly the same decoded shape as the child Model. Both array forms default placement to `field`. Union, suspended, and other opaque direct child Schemas, opaque, union, or open/index-signature wrappers, optional collections, and custom writes use the general keyed form with `readAll`, function-valued `key`, `read`, and `writeAt`. Supply exactly one of `parentMessage` and `toParentMessage` for a static Binding; keyed Message mappings receive both the key and child Message. An explicit placement overrides the field or Block ID default. `subscriptions.when` gates only Streams. OutMessage handling is parent policy.

### Feature.step

`Feature.step(producer)` authors a pure operation over the child Model. It infers the operation's arguments, result Messages and Command requirements. Select public operations in the completed Block's `expose` record; internal Steps need not be exposed.

### binding.fold

`binding.fold(model, message, ...context)` forwards a received child Message through the child update and the Binding's policies. Parents import the child Message Schema to declare their wrapper Message, but should invoke a named operation when initiating a change.

### Exposed Binding operations

A declared operation such as `clearSelection` becomes `binding.clearSelection(...args)`. It returns a parent Update.Step through the same Model access, Command lifting, resource access, and OutMessage policy as `fold`. A keyed Binding takes the occurrence key before the operation arguments. Operation names cannot collide with Binding members such as `fold`, `init`, or `embedView`.

### binding.init

`binding.init(...args)` runs child init and returns the child Model with Commands already scoped and lifted to the parent Message type. A keyed Binding takes the occurrence key first.

### binding.embedView

`binding.embedView({ slotId, model, viewInputs? })` returns the only accepted `h.block` config for that placement. A keyed Binding also requires `key`.

### Block.inspectBinding

`Block.inspectBinding(binding)` exposes the exact Subscriptions, ManagedResources, Mounts, and `EffectsLayer` carried by a static or keyed Binding. Use it when tooling or a lifecycle test must inspect eligibility. Normal parent code uses the Binding's `placement`, `init`, `fold`, `embedView`, and exposed operations; Composition collects the Binding's lifecycle records and handler graph automatically.

::Snippet{name="blockInspectConnection" label="Inspecting Binding lifecycle metadata"}

### block.replaceEffectsLayer

`block.replaceEffectsLayer(recipe)` selects another complete local handler recipe and returns a completed Block with the same state, lifecycle, children, and public operations.

### block.provideHandlers

`block.provideHandlers(layer)` satisfies handler contracts intentionally left for the embedding host. It preserves the original definitions and composes the supplied providers into the selected handler graph.
