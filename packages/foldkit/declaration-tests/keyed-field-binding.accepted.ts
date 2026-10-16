import { Array, Context, Effect, Layer, Option, Schema } from 'effect'
import {
  Block,
  Schema as FoldkitSchema,
  Message,
  Struct,
  Update,
} from 'foldkit'

const ChildModel = Schema.Struct({ id: Schema.String, count: Schema.Number })
const ChildMessage = Message.defineMessageUnion({
  UpdatedCount: { count: Schema.Number },
  CompletedReadCount: { count: Schema.Number },
})
const Child = Block.define('DeclarationKeyedFieldChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ChildComposition = Child.toComposition()
export const ChildBlock = ChildComposition.toBlock({
  init: ChildComposition.init(() => ({
    model: ChildModel.make({ id: 'initial', count: 0 }),
  })),
  update: ChildComposition.update((model, message) =>
    ChildMessage.match(message, {
      UpdatedCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
      CompletedReadCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
    }),
  ),
  EffectsLayer: Layer.empty,
})

export const CallableChildModel = FoldkitSchema.taggedStruct(
  'DeclarationCallableKeyedFieldChild',
  { id: Schema.String, count: Schema.Number },
)
const CallableChild = Block.define('DeclarationCallableKeyedFieldChild', {
  Model: CallableChildModel,
  Message: ChildMessage,
})
const CallableChildComposition = CallableChild.toComposition()
export const CallableChildBlock = CallableChildComposition.toBlock({
  init: CallableChildComposition.init(() => ({
    model: CallableChildModel({ id: 'initial', count: 0 }),
  })),
  update: CallableChildComposition.update((model, message) =>
    ChildMessage.match(message, {
      UpdatedCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
      CompletedReadCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
    }),
  ),
  EffectsLayer: Layer.empty,
})

export const RefinedId = Schema.String.pipe(
  Schema.brand('DeclarationKeyedFieldRefinedId'),
)
const RefinedKeyModel = Schema.Struct({
  id: RefinedId,
  kind: Schema.Literal('Child'),
  count: Schema.Number,
})
const RefinedKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const RefinedKeyChild = Block.define('DeclarationRefinedKeyChild', {
  Model: RefinedKeyModel,
  Message: RefinedKeyMessage,
})
const RefinedKeyComposition = RefinedKeyChild.toComposition()
export const RefinedKeyBlock = RefinedKeyComposition.toBlock({
  init: RefinedKeyComposition.init(() => ({
    model: RefinedKeyModel.make({
      id: Schema.decodeSync(RefinedId)('initial'),
      kind: 'Child',
      count: 0,
    }),
  })),
  update: RefinedKeyComposition.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})

const ArrayChildModel = Schema.Array(Schema.String)
const ArrayChildMessage = Message.defineMessageUnion({ IgnoredValue: {} })
const ArrayChild = Block.define('DeclarationArrayModelChild', {
  Model: ArrayChildModel,
  Message: ArrayChildMessage,
})
const ArrayChildComposition = ArrayChild.toComposition()
export const ArrayChildBlock = ArrayChildComposition.toBlock({
  init: ArrayChildComposition.init(() => ({
    model: ArrayChildModel.make(['initial']),
  })),
  update: ArrayChildComposition.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})

export class ChildCounter extends Context.Service<
  ChildCounter,
  Readonly<{ count: Effect.Effect<number> }>
>()('DeclarationKeyedFieldChildCounter') {}
export const ChildOutMessage = Message.defineMessageUnion({
  RequestedSelection: {},
})
const OutChild = Block.define('DeclarationKeyedFieldOutChild', {
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
export const ReadChildCount = OutChild.command('ReadChildCount', {
  messages: [ChildMessage.CompletedReadCount],
  handler: function* () {
    const counter = yield* ChildCounter

    return () =>
      counter.count.pipe(
        Effect.map(count => ChildMessage.CompletedReadCount({ count })),
      )
  },
})
const OutChildComposition = OutChild.toComposition()
export const OutChildBlock = OutChildComposition.toBlock({
  init: OutChildComposition.init(() => ({
    model: ChildModel.make({ id: 'initial', count: 0 }),
  })),
  update: OutChildComposition.update((model, message) =>
    ChildMessage.match(message, {
      UpdatedCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
      CompletedReadCount: ({ count }) => ({
        model: Struct.modifyFields(model, { count: () => count }),
      }),
    }),
  ),
  expose: {
    refresh: OutChild.step(model => ({
      model,
      commands: [ReadChildCount()],
    })),
    select: OutChild.step(model => ({
      model,
      outMessage: ChildOutMessage.RequestedSelection(),
    })),
  },
  EffectsLayer: ReadChildCount.layer,
})

const WrappedRow = Schema.Struct({
  rowId: Schema.String,
  child: ChildModel,
})
const EquivalentChildModel = Schema.Struct({
  count: Schema.Number,
  id: Schema.String,
})
type Expect<Value extends true> = Value
type MutuallyAssignable<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false
type IsAny<Value> = 0 extends 1 & Value ? true : false
type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false
type NotAnyOrUnknownProof<Value> =
  IsAny<Value> extends true
    ? [error: never]
    : IsUnknown<Value> extends true
      ? [error: never]
      : []
declare const expectNotAnyOrUnknown: <Value>(
  value: Value,
  ...proof: NotAnyOrUnknownProof<Value>
) => void

const ParentModel = Schema.Struct({
  entries: Schema.Array(ChildModel),
  equivalentEntries: Schema.Array(EquivalentChildModel),
  suspendedEntries: Schema.suspend(() => Schema.Array(ChildModel)),
  brandedEntries: Schema.Array(RefinedKeyModel),
  literalEntries: Schema.Array(RefinedKeyModel),
  arrayChild: ArrayChildModel,
  outEntries: Schema.Array(ChildModel),
  wrappedRows: Schema.Array(WrappedRow),
  maybeRoom: Schema.Option(ChildModel),
})
export const ParentMessage = Message.defineMessageUnion({
  GotEntryMessage: { id: Schema.String, message: ChildMessage },
  GotWrappedMessage: { rowId: Schema.String, message: ChildMessage },
  GotRoomMessage: { roomId: Schema.String, message: ChildMessage },
  GotRefinedMessage: { id: Schema.String, message: RefinedKeyMessage },
  GotArrayChildMessage: { message: ArrayChildMessage },
})
export const Parent = Block.define('DeclarationKeyedFieldParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

export const CallableParentModel = FoldkitSchema.taggedStruct(
  'DeclarationCallableKeyedFieldParentModel',
  { entries: Schema.Array(CallableChildModel) },
)
export const CallableParent = Block.define(
  'DeclarationCallableKeyedFieldParent',
  {
    Model: CallableParentModel,
    Message: ParentMessage,
  },
)
export const CallableEntriesBinding = CallableParent.bindChild(
  CallableChildBlock,
  {
    field: 'entries',
    key: 'id',
    toParentMessage: (id, message) =>
      ParentMessage.GotEntryMessage({ id, message }),
    fromParentMessage: false,
  },
)
CallableParent.toComposition({ childBindings: [CallableEntriesBinding] })
export const callableInitialParentModel = CallableParentModel({
  entries: [CallableChildModel({ id: 'first', count: 1 })],
})

export const EntriesBinding = Parent.bindChild(ChildBlock, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: false,
  subscriptions: {
    when: (model, id) => {
      expectNotAnyOrUnknown(model)
      expectNotAnyOrUnknown(id)
      type ParentModelContextIsExact = Expect<
        MutuallyAssignable<typeof model, typeof ParentModel.Type>
      >
      type KeyContextIsExact = Expect<MutuallyAssignable<typeof id, string>>
      const parentModelContextIsExact: ParentModelContextIsExact = true
      const keyContextIsExact: KeyContextIsExact = true
      void parentModelContextIsExact
      void keyContextIsExact

      return id !== ''
    },
  },
})

const InitializedParentModel = Schema.Struct({
  entries: Schema.Array(ChildModel),
  status: Schema.Literal('Ready'),
})
const InitializedParent = Block.define(
  'DeclarationInitializedKeyedFieldParent',
  {
    Model: InitializedParentModel,
    Message: ParentMessage,
  },
)
export const InitializedEntriesBinding = InitializedParent.bindChild(
  ChildBlock,
  {
    field: 'entries',
    key: 'id',
    toParentMessage: (id, message) =>
      ParentMessage.GotEntryMessage({ id, message }),
    fromParentMessage: false,
    init: {
      occurrences: (status: 'Ready') => [{ key: 'initial', args: [] }],
      toItem: (_occurrence, child) => child,
    },
  },
)
const InitializedParentComposition = InitializedParent.toComposition({
  childBindings: [InitializedEntriesBinding],
})
export const initializeKeyedParent = InitializedParentComposition.init(
  (status: 'Ready') => ({
    startup: status,
    model: { status },
  }),
)

export const EquivalentEntriesBinding = Parent.bindChild(ChildBlock, {
  field: 'equivalentEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: false,
})

export const SuspendedEntriesBinding = Parent.bindChild(ChildBlock, {
  field: 'suspendedEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: false,
})

export const BrandedEntriesBinding = Parent.bindChild(RefinedKeyBlock, {
  field: 'brandedEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotRefinedMessage({ id, message }),
  fromParentMessage: false,
})

export const LiteralEntriesBinding = Parent.bindChild(RefinedKeyBlock, {
  field: 'literalEntries',
  key: 'kind',
  toParentMessage: (id, message) =>
    ParentMessage.GotRefinedMessage({ id, message }),
  fromParentMessage: false,
})

export const ArrayChildBinding = Parent.bindChild(ArrayChildBlock, {
  field: 'arrayChild',
  toParentMessage: message => ParentMessage.GotArrayChildMessage({ message }),
  fromParentMessage: false,
})

export const OutEntriesBinding = Parent.bindChild(OutChildBlock, {
  field: 'outEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: false,
  outMessage: {
    fold: (id, outMessage, context) => {
      const exactId: string = id
      const exactOutMessage: typeof ChildOutMessage.Type = outMessage
      const exactContext: Update.FoldContext<
        typeof ChildMessage.Type,
        typeof ParentMessage.Type,
        typeof ParentModel.Type
      > = context
      void exactId
      void exactOutMessage
      void exactContext

      return Parent.step(model => ({ model }))
    },
  },
})
export const outEntriesInspection = Block.inspectBinding(OutEntriesBinding)

export const WrappedRowsBinding = Parent.bindChild(ChildBlock, {
  placement: 'wrappedRows',
  readAll: model => model.wrappedRows,
  key: row => row.rowId,
  read: row => row.child,
  writeAt: (model, rowId, nextChild) =>
    Struct.modifyFields(model, {
      wrappedRows: Array.map(row =>
        row.rowId === rowId
          ? Struct.modifyFields(row, { child: () => nextChild })
          : row,
      ),
    }),
  toParentMessage: (rowId, message) =>
    ParentMessage.GotWrappedMessage({ rowId, message }),
  fromParentMessage: false,
})

export const RoomBinding = Parent.bindChild(ChildBlock, {
  readAll: model => Option.toArray(model.maybeRoom),
  key: child => child.id,
  read: child => child,
  writeAt: (model, _roomId, nextRoom) =>
    Struct.modifyFields(model, { maybeRoom: () => Option.some(nextRoom) }),
  toParentMessage: (roomId, message) =>
    ParentMessage.GotRoomMessage({ roomId, message }),
  fromParentMessage: false,
})

export const ParentComposition = Parent.toComposition({
  childBindings: [
    EntriesBinding,
    EquivalentEntriesBinding,
    SuspendedEntriesBinding,
    BrandedEntriesBinding,
    LiteralEntriesBinding,
    ArrayChildBinding,
    OutEntriesBinding,
    WrappedRowsBinding,
    RoomBinding,
  ],
})

export const initialParentModel = ParentModel.make({
  entries: [ChildModel.make({ id: 'first', count: 1 })],
  equivalentEntries: [
    EquivalentChildModel.make({ id: 'equivalent', count: 1 }),
  ],
  suspendedEntries: [ChildModel.make({ id: 'suspended', count: 1 })],
  brandedEntries: [
    RefinedKeyModel.make({
      id: Schema.decodeSync(RefinedId)('branded'),
      kind: 'Child',
      count: 1,
    }),
  ],
  literalEntries: [
    RefinedKeyModel.make({
      id: Schema.decodeSync(RefinedId)('literal'),
      kind: 'Child',
      count: 1,
    }),
  ],
  arrayChild: ['initial'],
  outEntries: [ChildModel.make({ id: 'out', count: 1 })],
  wrappedRows: [],
  maybeRoom: Option.none(),
})
