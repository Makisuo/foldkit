# Update

## One Function Defines Every Transition {#overview}

The update function receives the current Model and a Message, then returns the next Model and any Commands for the runtime to execute. It is the only place application state changes.

Update is pure. Given the same Model and Message, it returns the same result. It does not mutate state, call browser APIs, start timers, or make requests. That makes a transition direct to test: pass in the inputs and assert on the returned values.

### Exhaustive Message Matching

Use `Message.match` to handle the Message union. If you add a Message and omit its branch, TypeScript reports the missing case. No `default` branch silently absorbs a new variant.

Use a `defineTaggedUnion` or `defineRouteUnion` namespace's `match` for exhaustive matching and `matchOrElse` for selected variants with a fallback. Use [Effect's `Match`](https://effect.website/docs/code-style/pattern-matching/) when one handler matches several tags, for Message partial matching, or for unions without their own matcher.

::Snippet{name="counterUpdate" label="Using update"}

### Building the Next Model

#### Pure Model Changes

Each branch describes one transition. `ClickedDecrement` and `ClickedIncrement` transform the current count. `ClickedReset` replaces it with zero. This version of the counter has no side effects, so all three omit `commands`.

The branches build their next Model with [modifyFields](/best-practices/immutability#immutable-updates). Each named field receives a function from its current value to its next value. Omitted fields keep their existing values and references, so the same update style continues to work as the Model grows.

#### Update Results

Update returns a record containing the next Model and, when needed, an array of Commands. A Command describes one side effect, such as an HTTP request, timer, or browser API call. The [Commands](/core/commands) page adds a delayed reset and puts the optional `commands` field to work.

## Returning Commands

### Command-Producing Branches

Return Commands beside the next Model from the Message branch that requests the work:

::Snippet{name="updateReturningCommands" label="Returning a Command from update"}

`ClickedIncrement` changes the count and asks the runtime to persist it. `CompletedPersistCount` records that the Command finished, but it has no more work to request, so that branch omits `commands`.

`definition.update` authors a Block's update and infers the handler services required by the Commands across all of its branches. It leaves the function's runtime behavior unchanged.

`Update.defineStep` does the same inference for a standalone Step producer. Annotate its Model parameter and let the helper infer the returned Command requirements and OutMessage. A pure OutMessage fold can use `OutMessage.match<Update.Step<Model, Message>>` directly; the matcher types its Model parameter without a Step helper. Callers can then compose that Step with pure Steps through `Update.combine` without naming a service union by hand.

`Update.RequirementsOf<typeof update>` extracts the inferred handler service union from an update. Use it when a parent or exported type needs to name those requirements. Application assembly reads the requirements from the update return type directly.

### Omitting Commands

An update, init, boot, or component helper that statically creates no Commands omits `commands`. When it computes a Commands collection, it returns that collection directly without checking whether it is empty. The [`foldkit/no-empty-commands-array`](/tooling/oxlint-plugin#no-empty-commands-array) lint rule rejects only a literal `commands: []` property.

## Composing Results

### Keeping Results Together

Fold a child `init` or `boot` result into the parent instead of unpacking its Model and Commands:

::Snippet{name="updateResultInit" label="Composing an init result"}

#### Operation-Named Results

For another update-like result, keep it attached to the operation that produced it. Name the value after the operation and use dot access. The same rule applies when a test consumes an update result:

::Snippet{name="updateResultTest" label="Testing an update result"}

When the operation name collides with the function, use a trailing underscore such as `init_`. Do not destructure or rename `model`, `commands`, or `outMessage`. Dot access does not make an OutMessage impossible to ignore. It keeps the operation and its returned values visibly connected.

#### Optional Command Collections

Pass optional Commands directly to APIs that accept them, including `Command.mapMessages`. Use `result.commands ?? []` only when the next operation requires an array for spreading, concatenating, execution, or an assertion.

### Composing Update Steps

#### Why Optional Commands Fail

TypeScript rejects this manual composition when the enclosing update returns `Update.Return<Model, Message>`:

::Snippet{name="updateOptionalCommandsError" label="Invalid optional Commands composition"}

Every Foldkit template enables `exactOptionalPropertyTypes`. With that setting, the optional `commands` property may be absent. When the property is present, it must contain Commands. `dialogOpen.commands` has the type `Update.Commands<Message> | undefined`, so TypeScript rejects `commands: dialogOpen.commands`.

This error often points to update results being composed by hand. When both operations update the same Model, express them as Steps and compose them with `Update.combine`:

::Snippet{name="updateCombineOpenDialog" label="Composing Update Steps"}

#### Child Bindings and Multiple Steps

A registered child binding projects `init`, `fold`, and every named public Step. These operations preserve the child's Message mapping, Command requirements, OutMessage policy, and origin scope. Call `binding.fold(model, message)` for the primary update and `binding.name(...args)` when composing a public entry point.

#### Combining Steps

Use `Update.combine` when two or more operations transform the same Model and a later Step should receive the Model produced by an earlier Step. Name that parameter `stepModel` when an inline Step needs it:

::Snippet{name="updateCombineFoldDialog" label="Composing a child fold and another Step"}

#### Command Order

`combine` appends the Commands to its returned array in Step order. The runtime forks those Commands independently, so an application must not depend on their execution or completion order.

Do not wrap one Step in `Update.combine`; call that operation directly.

### Combining Child Initialization Results {#combining-independent-results}

Initialize each child through its registered binding. Each result already carries parent Messages and qualified Command origins, so parent init can assemble their Models and concrete Command collections directly.

For example, a Workspace Block contains Search and Editor Blocks. The Search Block's boot result can report a prepared document, and the Editor Block's can report an opened document. The Workspace Block handles both locally:

::Snippet{name="updateIndependentInits" label="Initializing Search and Editor Blocks"}

#### Parent Construction and Fold Order

`Model.make` assembles the Search and Editor Models with the Workspace Block's own fields. The binding results retain each child's optional Commands; combine them only where parent init needs one concrete collection.

#### Step Order

The Step array determines the order of Model transitions. In this example, the Search restoration runs first. The Editor restoration receives that updated Model, so it preserves the selected document. Each child's binding applies its OutMessage policy as part of the Step.

#### Command Execution

The Step order applies to Model changes. Commands run independently; a later child's Commands do not wait for an earlier child's Commands to finish.

### Initializing Children with OutMessages

#### Combining Child Facts

A parent can translate facts from several children into its own OutMessage. For example, Application contains a Workspace Block, which contains Search and Editor Blocks. Their public restoration Steps report `RestoredQuery` and `RestoredDraft` after the complete Workspace Model exists.

#### Translating Child Facts

Each child binding uses `outMessage.forward` to translate selected facts into Workspace OutMessages. The same policy applies whether a restoration Step runs during startup or in a later update:

::Snippet{name="updateInitOutMessages" label="Forwarding child restoration OutMessages"}

#### Several Child Facts

`Update.combine` returns at most one parent OutMessage. When several Steps emit one, the later result wins. Run restorations as separate updates when every fact must reach the next parent, or derive one combined parent fact after the Steps from the final Model.

#### Deriving from the Final Model

When the final Model contains everything needed for the parent's OutMessage, attach that OutMessage afterward with [`Update.withOutMessage`](#returning-an-outmessage).

### Deriving an OutMessage in a Local Fold

A local fold can report a more complete result than the child's original OutMessage. For example, an end-date picker reports `SelectedDate`. A date-range Block forwards `SelectedEndDate` while the start date is absent. Once both dates are known, its local fold reports `CompletedRange` instead:

::Snippet{name="updateInitDerivedOutMessage" label="Deriving a completed range OutMessage"}

#### Replacement Rule

When `outMessage.fold` returns `CompletedRange`, Foldkit uses it and skips `outMessage.forward` for that dispatch. When the fold returns no OutMessage, `outMessage.forward` supplies `SelectedEndDate`. A child that emits nothing triggers neither handler.

## Preventing Lost OutMessages

### Return Type Boundaries

Use `Update.Return<Model, Message>` for an update that cannot emit an OutMessage. It prevents a result containing an OutMessage from entering code that would keep only its Model and Commands:

::Snippet{name="updateRejectLostOutMessage" label="Rejected OutMessage-producing result"}

Otherwise, that OutMessage would be lost.

A result with no `outMessage` can still be used where `Update.ReturnWithOutMessage<Model, Message, OutMessage>` is expected:

::Snippet{name="updateAcceptMissingOutMessage" label="Accepted plain update result"}

The missing field means this update emitted no OutMessage.

### Returning an OutMessage

#### Known OutMessages

When the OutMessage is already known while constructing a new result, include it directly:

::Snippet{name="updateKnownOutMessage" label="Returning a known OutMessage"}

#### Attaching an Optional OutMessage

Use `Update.withOutMessage` when attaching an OutMessage to an existing plain result or when the value has the type `OutMessage | undefined`. If an operation already produced the plain result, pipe that named result into the helper:

::Snippet{name="updateWithOutMessage" label="Attaching an optional OutMessage"}

The object-spread alternative is easy to get wrong:

::Snippet{name="updateAvoidOutMessageSpread" label="Invalid OutMessage object spread"}

`Update.withOutMessage` preserves `dialogClose.model` and `dialogClose.commands`. A defined value becomes `outMessage`; `undefined` leaves the property out. The update result must be a plain return, so the helper cannot overwrite an OutMessage another operation emitted.

#### Constructing Inline

When constructing the plain result in the same expression and the value has the type `OutMessage | undefined`, pass the result first: `Update.withOutMessage({ model, commands }, outMessage)`.
