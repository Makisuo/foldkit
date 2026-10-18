import { Array, Context, Effect, Layer, Option, Schema } from 'effect'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as Update from 'foldkit/update'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false

type Expect<Value extends true> = Value

const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({
  ChangedCount: { amount: Schema.Number },
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ChildDefinition = Block.define('StrictRoutingChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ChildComposition = ChildDefinition.makeComposition()
export const ChildBlock = ChildComposition.makeBlock({
  init: ChildComposition.makeInit(() => ({
    model: ChildModel.make({ count: 0 }),
  })),
  update: ChildComposition.makeUpdate((model, message) => ({
    model: modifyFields(model, {
      count: count => count + message.amount,
    }),
  })),
})

type DispatchContext = Readonly<{ multiplier: number }>

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ContextChildDefinition = Block.define('StrictRoutingContextChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ContextChildComposition = ContextChildDefinition.makeComposition()
export const ContextChildBlock = ContextChildComposition.makeBlock({
  init: ContextChildComposition.makeInit(() => ({
    model: ChildModel.make({ count: 0 }),
  })),
  update: ContextChildComposition.makeUpdate(
    (model, message, context: DispatchContext) => ({
      model: modifyFields(model, {
        count: count => count + message.amount * context.multiplier,
      }),
    }),
  ),
})

const Entry = Schema.Struct({
  id: Schema.String,
  child: ChildModel,
})
export const ParentModel = Schema.Struct({
  child: ChildModel,
  contextualChild: ChildModel,
  entries: Schema.Array(Entry),
  multiplier: Schema.Number,
  resets: Schema.Number,
})
export const ParentMessage = defineMessageUnion({
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotChildMessage: { message: ChildMessage },
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotContextEvent: { event: ChildMessage },
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotEntry: { id: Schema.String, event: ChildMessage },
  ClickedReset: {},
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ParentDefinition = Block.define('StrictRoutingParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

export const CanonicalBinding = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

export const ContextBinding = ParentDefinition.bindChild(ContextChildBlock, {
  field: 'contextualChild',
  toParentMessage: (message): typeof ParentMessage.Type =>
    ParentMessage.GotContextEvent({ event: message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotContextEvent,
    args: (model, { event }) =>
      Option.some([event, { multiplier: model.multiplier }]),
  },
})

export const KeyedBinding = ParentDefinition.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id
          ? modifyFields(entry, { child: () => nextChild })
          : entry,
      ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotEntry({ id, event: message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntry,
    args: (_model, { id, event }) =>
      id === 'active' ? Option.some([id, event]) : Option.none(),
  },
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ParentComposition = ParentDefinition.makeComposition({
  childBindings: [CanonicalBinding, ContextBinding, KeyedBinding],
})

export const parentUpdate = ParentComposition.makeUpdate((model, message) => {
  type AuthoredMessageIsLocal = Expect<
    Equal<typeof message, typeof ParentMessage.ClickedReset.Type>
  >

  const _proof: AuthoredMessageIsLocal = true
  void _proof

  return {
    model: modifyFields(model, { resets: resets => resets + 1 }),
  }
})

export const parentModel = ParentModel.make({
  child: ChildModel.make({ count: 0 }),
  contextualChild: ChildModel.make({ count: 0 }),
  entries: [Entry.make({ id: 'active', child: ChildModel.make({ count: 0 }) })],
  multiplier: 3,
  resets: 0,
})

export const rawFullMessageUpdate = (
  model: typeof ParentModel.Type,
  message: typeof ParentMessage.Type,
) => ({
  model: modifyFields(model, {
    resets: resets =>
      message._tag === 'GotChildMessage' ? resets + 100 : resets + 1,
  }),
})

export const RawCompletionBlock = ParentComposition.makeBlock({
  init: ParentComposition.makeInit(() => ({
    model: {
      entries: [],
      multiplier: 1,
      resets: 0,
    },
  })),
  update: rawFullMessageUpdate,
})

export const GeneratedCompletionBlock = ParentComposition.makeBlock({
  init: ParentComposition.makeInit(() => ({
    model: {
      entries: [],
      multiplier: 1,
      resets: 0,
    },
  })),
  update: parentUpdate,
})

type RawUpdateSignatureIsPreserved = Expect<
  Equal<typeof RawCompletionBlock.update, typeof rawFullMessageUpdate>
>

const rawUpdateSignatureProof: RawUpdateSignatureIsPreserved = true
void rawUpdateSignatureProof

const SilentModel = Schema.Struct({ ready: Schema.Boolean })
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const SilentDefinition = Block.define('StrictRoutingSilent', {
  Model: SilentModel,
  Message: Schema.Never,
})
class SilentClient extends Context.Service<
  SilentClient,
  Readonly<{ wait: Effect.Effect<never> }>
>()('StrictRouting/SilentClient') {}
const WaitForever = SilentDefinition.command('WaitForever', {
  messages: [],
  handler: function* () {
    const client = yield* SilentClient
    return () => client.wait
  },
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const SilentComposition = SilentDefinition.makeComposition()
export const silentUpdate = SilentComposition.makeUpdate()
export const SilentBlock = SilentComposition.makeBlock({
  init: SilentComposition.makeInit(() => ({
    model: SilentModel.make({ ready: true }),
    commands: [WaitForever()],
  })),
  update: silentUpdate,
  EffectsLayer: WaitForever.layer,
})

const SilentParentModel = Schema.Struct({ silent: SilentModel })
const SilentParentMessage = defineMessageUnion({
  ClickedParent: {},
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const SilentParentDefinition = Block.define(
  'StrictRoutingSilentParent',
  {
    Model: SilentParentModel,
    Message: SilentParentMessage,
  },
)

export const SilentBinding = SilentParentDefinition.bindChild(SilentBlock, {
  field: 'silent',
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const SilentParentComposition = SilentParentDefinition.makeComposition({
  childBindings: [SilentBinding],
})
export const initializeSilent = SilentParentDefinition.step(model =>
  SilentBinding.init({
    args: [],
    toParentModel: silent => modifyFields(model, { silent: () => silent }),
  }),
)
export const SilentParentBlock = SilentParentComposition.makeBlock({
  init: SilentParentComposition.makeInit(() => ({
    model: {},
  })),
  update: SilentParentComposition.makeUpdate(model => ({ model })),
})

const ImpossibleParentMessage = defineMessageUnion({
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotImpossible: { message: Schema.Never },
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ImpossibleParentDefinition = Block.define(
  'StrictRoutingImpossibleParent',
  {
    Model: Schema.Null,
    Message: ImpossibleParentMessage,
  },
)
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ImpossibleParentComposition =
  ImpossibleParentDefinition.makeComposition()

type SilentUpdateParameters = Expect<
  Equal<
    Parameters<typeof silentUpdate>,
    [model: typeof SilentModel.Type, message: never]
  >
>

const silentUpdateParametersProof: SilentUpdateParameters = true
void silentUpdateParametersProof

type SilentOperationRequirements = Expect<
  Equal<
    Update.RequirementsOf<typeof initializeSilent>,
    Block.Scoped<'silent', Command.HandlerOf<typeof WaitForever>>
  >
>
type LayerInput<LayerValue> =
  // oxlint-disable-next-line typescript/no-explicit-any -- This fixture deliberately probes erased any channels or detects any in an inferred public type.
  LayerValue extends Layer.Layer<any, any, infer Requirements>
    ? Requirements
    : never
type SilentLayerRequirements = Expect<
  Equal<LayerInput<typeof SilentParentBlock.EffectsLayer>, SilentClient>
>

const silentOperationRequirementsProof: SilentOperationRequirements = true
const silentLayerRequirementsProof: SilentLayerRequirements = true
void silentOperationRequirementsProof
void silentLayerRequirementsProof
