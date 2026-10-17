import { Array, Context, Effect, Layer, Option, Schema, Tuple } from 'effect'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { defineMessageUnion } from 'foldkit/message'
import * as Mount from 'foldkit/mount'
import { modifyFields } from 'foldkit/struct'
import * as Update from 'foldkit/update'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export class Recorder extends Context.Service<
  Recorder,
  Readonly<{ record(value: string): void }>
>()('ExposeMessageProof/Recorder') {}

export const ChildModel = Schema.Struct({ value: Schema.String })
export type ChildModel = typeof ChildModel.Type
export const ChildMessage = defineMessageUnion({
  RequestedReset: {},
  UpdatedValue: { value: Schema.String },
  CompletedRecord: {},
})
export type ChildMessage = typeof ChildMessage.Type
export const ChildOutMessage = defineMessageUnion({
  ChangedValue: { value: Schema.String },
})
export type ChildOutMessage = typeof ChildOutMessage.Type

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ChildDefinition = Block.define('ExposeMessageProofChild', {
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
export const RecordValue = ChildDefinition.command('RecordValue', {
  args: { value: Schema.String },
  messages: [ChildMessage.CompletedRecord],
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ChildComposition = ChildDefinition.makeComposition()
export const childUpdate = ChildComposition.makeUpdate((model, message) =>
  ChildMessage.match<
    Update.ReturnWithOutMessage<
      ChildModel,
      ChildMessage,
      ChildOutMessage,
      Command.HandlerOf<typeof RecordValue>
    >
  >(message, {
    RequestedReset: () => ({
      model: modifyFields(model, { value: () => '' }),
    }),
    UpdatedValue: ({ value }) => ({
      model: modifyFields(model, { value: () => value }),
      commands: [RecordValue({ value })],
      outMessage: ChildOutMessage.ChangedValue({ value }),
    }),
    CompletedRecord: () => ({ model }),
  }),
)

export const ChildBlock = ChildComposition.makeBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: childUpdate,
  operations: {
    reset: () => [ChildMessage.RequestedReset()],
    setValue: (value: string) => [ChildMessage.UpdatedValue({ value })],
  },
  EffectsLayer: Layer.empty,
  hostHandlers: [RecordValue],
})

export const ContextModel = Schema.Struct({ value: Schema.String })
export const ContextMessage = defineMessageUnion({
  UpdatedValue: { value: Schema.String },
})
export type RequiredContext = Readonly<{ source: string }>
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ContextChildDefinition = Block.define(
  'ExposeMessageProofContextChild',
  {
    Model: ContextModel,
    Message: ContextMessage,
  },
)
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ContextComposition = ContextChildDefinition.makeComposition()
export const contextUpdate = ContextComposition.makeUpdate(
  (
    model,
    { value },
    required: RequiredContext,
    maybeCount?: number,
    label = 'default',
    ...flags: ReadonlyArray<boolean>
  ) => ({
    model: modifyFields(model, {
      value: () =>
        `${required.source}:${value}:${maybeCount ?? 0}:${label}:${flags.length}`,
    }),
  }),
)
export const ContextBlock = ContextComposition.makeBlock({
  init: () => ({ model: ContextModel.make({ value: '' }) }),
  update: contextUpdate,
  operations: {
    setRequired: (value: string, required: RequiredContext) => [
      ContextMessage.UpdatedValue({ value }),
      required,
    ],
    setAll: (
      value: string,
      required: RequiredContext,
      maybeCount: number | undefined,
      label: string | undefined,
      ...flags: ReadonlyArray<boolean>
    ) => [
      ContextMessage.UpdatedValue({ value }),
      required,
      maybeCount,
      label,
      ...flags,
    ],
  },
})

export const ParentModel = Schema.Struct({
  child: ChildModel,
  entries: Schema.Array(
    Schema.Struct({ id: Schema.String, child: ChildModel }),
  ),
})
export type ParentModel = typeof ParentModel.Type
export const ParentMessage = defineMessageUnion({
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotChildMessage: { message: ChildMessage },
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotEntryMessage: { id: Schema.String, message: ChildMessage },
  RequestedNoop: {},
  RequestedSetChild: { value: Schema.String },
  RequestedSetEntry: { id: Schema.String, value: Schema.String },
})
export type ParentMessage = typeof ParentMessage.Type
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ParentDefinition = Block.define('ExposeMessageProofParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
export const ChildBinding = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    fold: ChildOutMessage.match<Update.Step<ParentModel, ParentMessage>>({
      ChangedValue: () => model => ({ model }),
    }),
  },
})
export const EntryBinding = ParentDefinition.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: entries =>
        Array.map(entries, entry =>
          entry.id === id ? { ...entry, child: nextChild } : entry,
        ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    args: (_model, { id, message }) => Option.some([id, message]),
  },
  outMessage: {
    fold: (_id, outMessage) =>
      ChildOutMessage.match<Update.Step<ParentModel, ParentMessage>>(
        outMessage,
        { ChangedValue: () => model => ({ model }) },
      ),
  },
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ParentComposition = ParentDefinition.makeComposition({
  childBindings: [ChildBinding, EntryBinding],
})
export const parentUpdate = ParentComposition.makeUpdate((model, message) =>
  ParentMessage.match(message, {
    RequestedNoop: () => ({ model }),
    RequestedSetChild: ({ value }) => ChildBinding.setValue(value)(model),
    RequestedSetEntry: ({ id, value }) =>
      EntryBinding.setValue(id, value)(model),
  }),
)

export const ParentBlock = ParentComposition.makeBlock({
  init: ParentComposition.makeInit(() => ({
    model: { entries: [{ id: 'first', child: { value: 'entry' } }] },
  })),
  update: parentUpdate,
  operations: {
    setChild: (value: string) => [ParentMessage.RequestedSetChild({ value })],
    setEntry: (id: string, value: string) => [
      ParentMessage.RequestedSetEntry({ id, value }),
    ],
  },
  EffectsLayer: Layer.empty,
})

export function makeChoice<
  const Values extends readonly [string, ...Array<string>],
>(values: Values) {
  const Value = Schema.Literals(values)
  const Model = Schema.Struct({ selected: Value })
  const Message = defineMessageUnion({
    UpdatedValue: { value: Value },
    CompletedObserve: {},
  })
  // oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
  const ChoiceOwnerDefinition = Block.define('ExposeMessageProofChoice')
  const Observe = ChoiceOwnerDefinition.mount('Observe', {
    messages: [Message.CompletedObserve],
  })
  // oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
  const ChoiceDefinition = ChoiceOwnerDefinition.define({ Model, Message })
  // oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
  const Composition = ChoiceDefinition.makeComposition({ mounts: [Observe] })
  const view = Composition.makeView.withInputs<Readonly<{ label: string }>>(
    (model, { label }, h) =>
      h.button(
        [h.OnMount(Observe())],
        [`${label}: ${globalThis.String(model.selected)}`],
      ),
  )
  const update = Composition.makeUpdate(
    (model, message, _required: RequiredContext) =>
      Message.match(message, {
        UpdatedValue: ({ value }) => ({
          model: modifyFields(model, { selected: () => value }),
        }),
        CompletedObserve: () => ({ model }),
      }),
  )
  const select = (value: Values[number], required: RequiredContext) =>
    Tuple.make(Message.UpdatedValue({ value }), required)

  const block = Composition.makeBlock({
    init: (selected: Values[number]) => ({ model: Model.make({ selected }) }),
    update,
    view,
    operations: { select },
    EffectsLayer: Layer.empty,
    hostHandlers: [Observe],
  })
  const provided = block.provideHandlers(
    Observe.toLayer(
      Effect.succeed(() => Effect.succeed(Message.CompletedObserve())),
    ),
  )

  return { block, provided, Observe }
}

export const FruitChoiceResult = makeChoice(['Apple', 'Pear'])
export const FruitChoice = FruitChoiceResult.block
export const ProvidedFruitChoice = FruitChoiceResult.provided

export const MountedChoiceModel = Schema.Struct({ selected: Schema.String })
export const MountedChoiceMessage = defineMessageUnion({
  UpdatedSelection: { value: Schema.String },
  CompletedObserveSelection: {},
})
export const MountedChoiceDefinition = Block.define('MountedChoice', {
  Model: MountedChoiceModel,
  Message: MountedChoiceMessage,
})
export const ObserveSelection = MountedChoiceDefinition.mount(
  'ObserveSelection',
  {
    messages: [MountedChoiceMessage.CompletedObserveSelection],
    handler: function* () {
      return () =>
        Effect.succeed(MountedChoiceMessage.CompletedObserveSelection())
    },
  },
)
export const MountedChoiceComposition = MountedChoiceDefinition.makeComposition(
  { mounts: [ObserveSelection] },
)
export const mountedChoiceView = MountedChoiceComposition.makeView((model, h) =>
  h.button([h.OnMount(ObserveSelection())], [model.selected]),
)
export const mountedChoiceUpdate = MountedChoiceComposition.makeUpdate(
  (model, message) =>
    MountedChoiceMessage.match(message, {
      UpdatedSelection: ({ value }) => ({
        model: modifyFields(model, { selected: () => value }),
      }),
      CompletedObserveSelection: () => ({ model }),
    }),
)
export const MountedChoiceBlock = MountedChoiceComposition.makeBlock({
  init: (selected: string) => ({
    model: MountedChoiceModel.make({ selected }),
  }),
  update: mountedChoiceUpdate,
  view: mountedChoiceView,
  operations: {
    select: (value: string) =>
      Tuple.make(MountedChoiceMessage.UpdatedSelection({ value })),
  },
  EffectsLayer: ObserveSelection.layer,
})
export const ManagedMountedChoiceBlock = MountedChoiceComposition.makeBlock({
  init: (selected: string) => ({
    model: MountedChoiceModel.make({ selected }),
  }),
  update: mountedChoiceUpdate,
  view: mountedChoiceView,
  managedResources: {},
  operations: {
    select: (value: string) =>
      Tuple.make(MountedChoiceMessage.UpdatedSelection({ value })),
  },
  EffectsLayer: ObserveSelection.layer,
})

export const ExactModel = Schema.Struct({ value: Schema.String })
export const ExactMessage = defineMessageUnion({ RequestedPing: {} })
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ExactDefinition = Block.define('ExposeMessageProofExact', {
  Model: ExactModel,
  Message: ExactMessage,
})
export function exactUpdate(
  model: typeof ExactModel.Type,
  _message: typeof ExactMessage.Type,
): Readonly<{ model: typeof ExactModel.Type; audit: 'exact' }> {
  return { model, audit: 'exact' }
}
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ExactComposition = ExactDefinition.makeComposition()
export const ExactBlock = ExactComposition.makeBlock({
  init: () => ({ model: ExactModel.make({ value: '' }) }),
  update: exactUpdate,
  operations: {
    ping: () => [ExactMessage.RequestedPing()],
    pingWithMetadata: () =>
      Object.assign(Tuple.make(ExactMessage.RequestedPing()), {
        model: 'TupleMetadata',
      }),
  },
  EffectsLayer: Layer.empty,
})

type SetValueArguments = Expect<
  Equal<Parameters<typeof ChildBinding.setValue>, [value: string]>
>
type KeyedSetValueArguments = Expect<
  Equal<Parameters<typeof EntryBinding.setValue>, [key: string, value: string]>
>
type RequiredArguments = Expect<
  Equal<
    Parameters<typeof ContextBlock.operations.setRequired>,
    [model: typeof ContextModel.Type, value: string, required: RequiredContext]
  >
>
type AllContextArguments = Expect<
  Equal<
    Parameters<typeof ContextBlock.operations.setAll>,
    [
      model: typeof ContextModel.Type,
      value: string,
      required: RequiredContext,
      maybeCount: number | undefined,
      label: string | undefined,
      ...flags: ReadonlyArray<boolean>,
    ]
  >
>
type GenericArguments = Expect<
  Equal<
    Parameters<typeof FruitChoice.operations.select>,
    [
      model: typeof FruitChoice.Model.Type,
      value: 'Apple' | 'Pear',
      required: RequiredContext,
    ]
  >
>
type GenericHostHandlersRemain = Expect<
  Equal<
    typeof FruitChoice.hostHandlers,
    readonly [typeof FruitChoiceResult.Observe]
  >
>
type GenericMountsRemain = Expect<
  typeof FruitChoice.mounts extends ReadonlyArray<Mount.LayeredMountDefinition>
    ? true
    : false
>
type ProvidedHostHandlersAreEmpty = Expect<
  Equal<typeof ProvidedFruitChoice.hostHandlers, readonly []>
>
type ProvidedGenericArguments = Expect<
  Equal<
    Parameters<typeof ProvidedFruitChoice.operations.select>,
    Parameters<typeof FruitChoice.operations.select>
  >
>
type CommandRequirementsRemain = Expect<
  Equal<
    Update.RequirementsOf<typeof ChildBlock.operations.setValue>,
    Command.HandlerOf<typeof RecordValue>
  >
>
type ExposedOutMessage =
  ReturnType<
    typeof ChildBlock.operations.setValue
  > extends Update.ReturnWithOutMessage<
    ChildModel,
    ChildMessage,
    infer OutMessage,
    // oxlint-disable-next-line typescript/no-explicit-any -- This fixture deliberately probes erased any channels or detects any in an inferred public type.
    any
  >
    ? OutMessage
    : never
type OutMessageRemains = Expect<Equal<ExposedOutMessage, ChildOutMessage>>
type ExactReturnRemains = Expect<
  Equal<
    ReturnType<typeof ExactBlock.operations.ping>,
    ReturnType<typeof exactUpdate>
  >
>

type TupleMetadataStillReceivesModel = Expect<
  Equal<
    Parameters<typeof ExactBlock.operations.pingWithMetadata>,
    [model: typeof ExactModel.Type]
  >
>
type TupleMetadataPreservesReturn = Expect<
  Equal<
    ReturnType<typeof ExactBlock.operations.pingWithMetadata>,
    ReturnType<typeof exactUpdate>
  >
>
export type TupleMetadataAssertions = [
  SetValueArguments,
  KeyedSetValueArguments,
  RequiredArguments,
  AllContextArguments,
  GenericArguments,
  GenericHostHandlersRemain,
  GenericMountsRemain,
  ProvidedHostHandlersAreEmpty,
  ProvidedGenericArguments,
  CommandRequirementsRemain,
  OutMessageRemains,
  ExactReturnRemains,
  TupleMetadataStillReceivesModel,
  TupleMetadataPreservesReturn,
]
