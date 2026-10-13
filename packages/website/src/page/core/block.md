# Block

## Overview

Build applications from Blocks. Fold their updates into a single application Model.

A Block packages a composable part of a Foldkit application: its Model, Messages, init and update, optional view, lifecycle effects, handler recipes, and public operations. Its parent binds it into the parent Model, drives its public API, and handles its OutMessages.

That one binding replaces repeated wiring across update, view, Subscriptions, ManagedResources, Mounts, and Effect Layers. The parent still owns application policy: where the child Model lives, when an optional child exists, how OutMessages affect the parent, which routes activate Subscriptions, initialization order, and where the child renders.

:::Info{label="Complete application"}
The [Typing Terminal application](/example-apps/typing-terminal) composes Home and Room as Blocks. Its [client source](https://github.com/foldkit/foldkit/tree/main/packages/typing-game/client/src) shows definitions split across files, parent bindings, route gates, OutMessages, and root service provision.
:::

## When to Create a Block

Use a Block when part of the application owns a state machine rather than only markup. Common reasons are:

- A reusable component owns interaction state, keyboard behavior, focus, or accessibility wiring.
- A feature area owns enough Model and Message variants that its update loop should be separate.
- A feature owns Commands or lifecycle work that should travel with its state and update boundary.

If a section only renders parent state, use a view function. A card that receives a title and content does not need its own Block.

## Define a Block {#child-block}

### Establish the feature boundary

Declare the Schemas, then call `Block.define('Settings', { Model, Message, OutMessage })`. This creates the local identity and typed authoring helpers together. The ID is local to the feature; do not include ancestors or filesystem paths. The declaration identifier must match the literal ID, so name this value `Settings`.

::Snippet{name="blockOwnerContract" label="Defining a typed Block"}

The returned value supplies `command`, `mount`, `mountStream`, `resource`, `update`, `step`, `view`, `subscriptions`, and `managedResources`. It provides the owning identity and precise contextual types, while retaining inferred Command and Service requirements. Keep this value in one module and import it; creating another definition with the same readable ID does not reuse the original definition.

Commands and lifecycle handlers declare local names such as `SaveTheme`. Foldkit derives the full runtime path from composition. Settings bound under Profile becomes `Profile/Settings/SaveTheme`; the feature remains reusable under another parent.

### Register the composition graph

Call `register({ children, mounts })` after defining the child connections and parent policies. It checks that graph and supplies the view capabilities available to assembly. The returned value preserves the established primitive and typed helpers.

Chain `Block.define(...).register(...)` when the child policies do not depend on earlier parent operations. Otherwise, keep the initial `Settings` value, author the parent Steps and connections, then use `const settings = Settings.register(...)`. This ordering breaks the inference cycle between a parent Step, the child policy that uses it, and the graph containing that policy. Nesting depth does not determine whether separate statements are needed.

Features without children or Mounts can use `view` and `assemble` directly. Registration configures capabilities; it does not build Layers or start child behavior.

### Assemble the feature

Call `assemble` after the feature's pieces exist. Composition is passive: it checks and records the implementation without building a Layer, running init, or starting lifecycle work.

::Snippet{name="blockOwnedDescriptor" label="Implementing a Block"}

Export the completed value as `block`. Parents import the feature namespace and use `Settings.block.connection(...)`.

`EffectsLayer` contains only the feature's local handler recipes. Omit it when the feature has no local handlers; Foldkit uses an empty recipe and still checks completeness. Registered child bindings contribute their complete recipes automatically. A handler Layer may require an HTTP client, store, RPC client, clock, or browser service. Those ordinary service requirements continue through composition until the application root supplies them.

### Multi-file organization

Organize files by responsibility. A split feature can keep its typed authoring declaration in `block.ts`, then assemble the completed value in `settings.ts`:

```text
settings/
├── block.ts         # typed authoring declaration
├── model.ts
├── message.ts
├── update.ts        # Commands live beside the update that returns them
├── view.ts
├── settings.ts      # completed Block and local EffectsLayer
└── index.ts         # explicit public barrel
```

Keep small features together. Add `subscription.ts`, `mount.ts`, or `managedResource.ts` when that concern makes a separate file easier to navigate. Extract `layer.ts` for substantial or reused composition, and `children.ts` for substantial binding policies. Keep the typed declaration separate from the completed feature when implementation files import its helpers. They must not import their own completed barrel: completion depends on those implementation files.

Export `block` and the intended structural pieces from the feature barrel. Export the feature as a namespace from the parent barrel. The namespace supplies context for `Settings.Model`, `Settings.Message`, `Settings.OutMessage.match`, and `Settings.block.connection`:

::Snippet{name="blockFeatureExports" label="Exporting a completed feature"}

## Bind a Child {#embedding}

Call the completed child's `connection` method in the parent. The binding records the child's placement in the parent Model and Message context.

::Snippet{name="blockBindDescriptor" label="Binding and embedding a Block"}

For a required direct Struct field, pass `Model` and `field` instead of read/write functions. Use `parentMessage: Message.GotSettingsMessage` when the wrapper contains only `{ message }`; Foldkit constructs that parent Message for every child Message, including Command results and lifecycle emissions. Use `toParentMessage` for custom mappings, and supply exactly one mapping field.

Placement defaults to `field` for this shorthand and to the child's Block ID for accessor connections. An explicit `placement` overrides either default. Two different fields therefore identify two different occurrences. Keep an override when composition identity should differ from storage location:

::Snippet{name="blockStaticPlacements" label="Binding two static placements"}

Register every binding through the parent's `register` method:

::Snippet{name="blockRegisterChildren" label="Registering child bindings"}

This registration is what lets Foldkit collect child handler recipes and lifecycle definitions, validate embedded views, derive qualified effect identities, and manage active occurrences.

### Fold child Messages {#fold-child}

Use `binding.fold(model, message, ...context)` in the wrapper Message handler. It runs the child's update, writes the next child Model, lifts Commands back to the parent Message type, and applies the binding's OutMessage policy.

::Snippet{name="blockFoldChild" label="Folding a bound child Message"}

Declare parent-driven operations under `steps`, then call them directly through the binding. Forward received child Messages through `fold`; use named operations for changes the parent initiates:

::Snippet{name="blockProjectedSteps" label="Calling a bound public operation"}

These calls are pure. They produce parent Update.Steps containing the next Model, optional Commands, and optional OutMessage. The Runtime executes returned Commands later. Every public operation receives the same read/write, absence, Command lifting, resource access, and OutMessage guarantees as `fold`.

Delegating an operation to update can share behavior. Use a truthful Message such as `RequestedClose`; a programmatic close did not click a button. A direct pure Step or shared pure helper is also valid. Do not invent a Message only to route through update. Omit `steps` when the Block exposes no named operations.

The bound forms retain the exact argument types, Command requirements, and OutMessage behavior of the child operation.

### Initialize the child

The parent decides how several initial Models combine. Call `binding.init(...args)`, put its Model into the parent Model, and retain its lifted Commands.

::Snippet{name="blockFoldChildInit" label="Initializing a bound child"}

Block init cannot emit an OutMessage. When startup must perform an ordinary transition that can surface a fact, expose a public API operation such as `boot` and apply it after the initial Model exists.

### Embed the child view {#wiring-the-view}

`binding.embedView` supplies the canonical view, the Message wrapper, the composition identity, and the binding's Mount evidence. Pass its result to `h.block`:

::Snippet{name="blockParentView" label="Embedding a bound child view"}

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

The parent spreads those groups onto its own elements. Child handlers still reach the child update through the binding's Message wrapper; parent handlers built alongside them reach the parent update.

::Snippet{name="blockChildAttributesConsume" label="Rendering child attributes"}

Block authors call `childAttributes`; consumers spread the supplied groups. Stateless render helpers such as Button already use the caller's builder and Message type, so they do not establish a child boundary or need this wrapper.

### Share parent renderers

Build shared renderers in the parent and pass them as top-level `viewInputs` callbacks. A renderer can embed a sibling Block through that sibling's registered binding. Each embed then establishes its own child boundary.

Thread `h` through view functions and render callbacks. Do not store a builder in module state; its dispatch context belongs to the current render boundary.

## Optional Children

`read` returns `Option` because a routed or conditional child may be absent. When it returns `None`:

- bound folds leave the parent Model unchanged;
- that occurrence's Subscription Streams stop;
- its ManagedResource handles release;
- its mounted elements clean up.

When the child reappears, Foldkit creates a new occurrence with new lifecycle scopes. A Command already running for the old occurrence keeps application lifetime, but its result is discarded if that occurrence is no longer current. This preserves Command interruption semantics while preventing a stale result from updating a replacement child.

Resource cleanup owns work that requires a live resource handle. See [operations using a handle](/core/managed-resources#operations-using-a-handle) for coordinating that lifetime with a running Command.

Use `subscriptions.when` for additional activation policy while the child remains present:

::Snippet{name="blockSubscriptionGate" label="Gating a child Subscription"}

The gate controls Streams. It does not remove the child or disable its update.

## OutMessages {#surfacing-facts}

A child reports facts to its parent through an OutMessage. Every binding of a Block with OutMessages must declare an explicit policy.

- `outMessage.fold` handles the fact in the current parent and returns a parent Step.
- `outMessage.forward` translates selected facts into the current Block's own OutMessage.
- A binding may do both. A derived OutMessage from the local fold takes precedence for that dispatch.

Build an OutMessage fold directly from the child's exhaustive matcher:

::Snippet{name="blockOutMessagePolicy" label="Handling a child OutMessage"}

The child does not know who embeds it. The parent decides what the reported fact means at that boundary.

An OutMessage fold receives `FoldContext` when its policy needs to lift a child Command or compare the transition with parent state from before the child update. `modelBeforeUpdate` is that previous parent Model. The Step returned by the fold still receives the parent Model after the next child Model has been written, so policy can deliberately use either side of the transition without reconstructing the fold by hand.

## Keyed Collections {#fold-child-at}

Use `keyedConnection` when one parent owns a dynamic collection of the same Block. The binding declares collection enumeration and stable identity once.

::Snippet{name="blockMultipleInstances" label="Binding a keyed collection" class="mb-4"}

Each active key gets independent Subscription, ManagedResource, and Mount scopes. `fold`, `step`, public API operations, `init`, and `embedView` take the key first. The key must be a stable string or finite number and must be unique in the current collection.

Removing a key synchronously makes its dispatchers stale and starts lifecycle cleanup. Reusing the same key later creates a new occurrence; results and callbacks captured by the earlier occurrence cannot update it.

Keyed bindings do not reconcile the collection itself. Application update remains responsible for adding, removing, and ordering items in the parent Model.

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

Use reflection only for silent synchronization. If the transition should emit Commands or an OutMessage, expose a public Step and use its bound form.

## Application Assembly

Import `define as defineApplication` from `foldkit/application` and export the typed `Application` from `application.ts`. Its owned methods author root Commands, updates, Steps, views, and lifecycle declarations. Register the root graph once, then call its owned `make` or `makeElement` method in `entry.ts` with the implementation pieces and browser inputs. A defined Application cannot be connected as a child:

::Snippet{name="blockApplicationDescriptor" label="Completing the Application"}

The defined Application already carries the registered child graph. Its completion config supplies local handler recipes and lifecycle definitions. `ApplicationLayer` supplies ordinary application services. It does not re-merge each feature's `EffectsLayer`.

`Application.make` validates the concrete composition before the Runtime starts. Missing handlers, incompatible child bindings, and unregistered Mount requirements are assembly errors rather than work discovered after a user interaction.

Server rendering uses the same root:

::Snippet{name="blockServerRender" label="Rendering the Application on the server"}

The server runs init and view. It does not construct browser handler Layers or start lifecycle work.

## Select a Handler Recipe {#select-a-local-handler-recipe}

The canonical `block` includes the feature's attached handlers. Most tests should keep them and replace their underlying service Layers. This exercises the same mapping, retry, error, and Message policy as production.

When a host intentionally replaces the feature's handlers as a group, call `replaceEffectsLayer` before connecting it:

::Snippet{name="blockEffectsLayerSelection" label="Selecting a feature handler recipe"}

Use the original definitions' `toLayer` methods so the alternate providers retain the same contracts and runtime identities. The selected recipe replaces the feature's local recipe and retains its registered child recipes. The unselected recipe is never built.

Whole-handler replacement is useful for a host-owned feature contract, a deliberately simulated demo environment, or focused Runtime orchestration tests. It is a secondary seam; service replacement is the usual application-testing boundary.

## Generic Blocks

A reusable factory can refine a completed Block with a Schema while sharing one identity and one local handler recipe. For this specialized case, `Block.define('Combobox')` establishes the identity and primitive methods before the single/multi and generic item contracts exist. Its `.define({ Model, Message, OutMessage })` method then establishes each typed contract under that same identity. Ordinary features use the two-argument form.

::Snippet{name="blockGenericDescriptor" label="Schema-refined Block"}

Keep the shared identity and recipe at module scope. Factory calls may refine Model, Message, OutMessage, view inputs, and public operation payloads. They must not manufacture new effect identities for the same reusable component.

## Lifetimes

Composition preserves the owner of each effect lifetime:

| Lifetime                    | Owner                                            |
| --------------------------- | ------------------------------------------------ |
| One application start       | Handler constructors and shared service Layers   |
| One Command invocation      | The returned Command handler                     |
| One active Block occurrence | Subscription Streams and ManagedResource handles |
| One mounted element         | Mount acquisition and cleanup                    |

Binding a Block does not build a Layer. The Runtime builds the selected handler graph once, then starts and stops occurrence work as the Model changes.

## Never Bypass the Child's Update {#never-bypass-the-update}

The parent stores the child Model but does not own its transitions. Do not reach into the child Model with `modifyFields`.

::Snippet{name="blockDirectModifyFieldsAntipattern" label="❌ Resetting child state directly"}

Expose a named operation under `steps` and call it through the binding:

::Snippet{name="blockDelegateViaHelper" label="✅ Resetting child state through a bound Step"}

This preserves invariants, Commands, OutMessages, effect requirements, and the child's freedom to change its Model shape.

## Boundary Identity and Model Identity {#boundary-id-and-model-identity}

A Block definition identifies a reusable feature. A binding identifies one placement in its parent. `slotId` identifies one render position, and a `keyedConnection` key identifies one dynamic occurrence. These values serve different jobs and should all remain stable.

The child Model may have its own domain ID. Foldkit does not infer runtime placement from that field. State identity and composition identity often coincide, but keeping the relationship explicit avoids hidden routing rules.

## Debugging in DevTools

Name wrapper Messages `Got<Child>Message`. DevTools uses that convention to group nested Message paths. Effect names come from the derived composition path, so repeated placements and keyed occurrences remain distinguishable while local definitions keep short names.

## API

### Block.define

`Block.define(id, { Model, Message, OutMessage? })` creates a local identity and typed authoring methods. `id` is a nonempty segment without `/` or `::` and matches its declaration identifier. `register({ mounts?, children? })` adds graph-aware view and assembly capabilities while retaining the established helpers.

For shared definitions specialized by a generic factory, `Block.define(id)` supplies the primitive methods and `.define(contracts)` establishes each later typed contract. Both forms are passive configuration.

### definition.assemble

`definition.assemble({ init, update, view?, steps?, subscriptions?, managedResources?, EffectsLayer?, hostHandlers? })` checks and returns the passive completed Block.

### block.connection

`block.connection(config)` creates one static or optional occurrence. Supply explicit `read`/`write`, or `Model`/`field` for a required direct Struct field. Supply exactly one of `parentMessage` and `toParentMessage`. An explicit placement overrides the field or Block ID default. Subscription gates and OutMessage handling are parent policies.

### block.keyedConnection

`block.keyedConnection(config)` binds a keyed collection. It requires `readAll`, `key`, `read`, `writeAt`, and `toParentMessage`, with keyed variants of Subscription gates and OutMessage policy.

### definition.step

`definition.step(producer)` authors a pure operation over the child Model. It infers the operation's arguments, result Messages and Command requirements. Register selected operations in the completed Block's `steps` record; internal Steps need not be exposed.

### binding.fold

`binding.fold(model, message, ...context)` forwards a received child Message through the child update and the binding's policies. Parents import the child Message Schema to declare their wrapper Message, but should invoke a named operation when initiating a change.

### Bound public operations

A declared operation such as `clearSelection` becomes `binding.clearSelection(...args)`. It returns a parent Update.Step through the same Model access, Command lifting, resource access and OutMessage policy as `fold`. A keyed binding takes the occurrence key before the operation arguments. Operation names cannot collide with connection members such as `fold`, `init` or `embedView`.

### binding.init

`binding.init(...args)` runs child init and returns the child Model with Commands already scoped and lifted to the parent Message type. A keyed binding takes the occurrence key first.

### binding.embedView

`binding.embedView({ slotId, model, viewInputs? })` returns the only accepted `h.block` config for that placement. A keyed binding also requires `key`.

### block.replaceEffectsLayer

`block.replaceEffectsLayer(recipe)` selects another complete local handler recipe and returns a completed Block with the same state, lifecycle, children, and public operations.

### block.provideHandlers

`block.provideHandlers(layer)` satisfies handler contracts intentionally left for the embedding host. It preserves the original definitions and composes the supplied providers into the selected handler graph.
