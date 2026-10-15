import { Array, Context, Effect, Layer, Option, Schema } from 'effect'

import {
  Block,
  Message,
  Schema as FoldkitSchema,
  Struct,
  Update,
} from '../src/index.js'

const ChildModel = Schema.Struct({ id: Schema.String, count: Schema.Number })
const ChildMessage = Message.defineMessageUnion({
  UpdatedCount: { count: Schema.Number },
  CompletedReadCount: { count: Schema.Number },
})
const Child = Block.define('DeclarationKeyedFieldChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
export const ChildBlock = Child.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ id: 'initial', count: 0 }) }),
  update: Child.update((model, message) =>
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
export const CallableChildBlock = CallableChild.toComposition().toBlock({
  init: () => ({
    model: CallableChildModel({ id: 'initial', count: 0 }),
  }),
  update: CallableChild.update((model, message) =>
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
export const RefinedKeyBlock = RefinedKeyChild.toComposition().toBlock({
  init: () => ({
    model: RefinedKeyModel.make({
      id: Schema.decodeUnknownSync(RefinedId)('initial'),
      kind: 'Child',
      count: 0,
    }),
  }),
  update: RefinedKeyChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})

const ArrayChildModel = Schema.Array(Schema.String)
const ArrayChildMessage = Message.defineMessageUnion({ IgnoredValue: {} })
const ArrayChild = Block.define('DeclarationArrayModelChild', {
  Model: ArrayChildModel,
  Message: ArrayChildMessage,
})
export const ArrayChildBlock = ArrayChild.toComposition().toBlock({
  init: () => ({ model: ArrayChildModel.make(['initial']) }),
  update: ArrayChild.update(model => ({ model })),
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
export const OutChildBlock = OutChild.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ id: 'initial', count: 0 }) }),
  update: OutChild.update((model, message) =>
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
export const callableEntries = CallableParent.bindChild(CallableChildBlock, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
})
CallableParent.toComposition({ children: [callableEntries] })
export const callableInitialParentModel = CallableParentModel({
  entries: [CallableChildModel({ id: 'first', count: 1 })],
})

export const entries = Parent.bindChild(ChildBlock, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  subscriptions: { when: (_model, id) => id !== '' },
})

export const equivalentEntries = Parent.bindChild(ChildBlock, {
  field: 'equivalentEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
})

export const suspendedEntries = Parent.bindChild(ChildBlock, {
  field: 'suspendedEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
})

export const brandedEntries = Parent.bindChild(RefinedKeyBlock, {
  field: 'brandedEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotRefinedMessage({ id, message }),
})

export const literalEntries = Parent.bindChild(RefinedKeyBlock, {
  field: 'literalEntries',
  key: 'kind',
  toParentMessage: (id, message) =>
    ParentMessage.GotRefinedMessage({ id, message }),
})

export const arrayChild = Parent.bindChild(ArrayChildBlock, {
  field: 'arrayChild',
  toParentMessage: message => ParentMessage.GotArrayChildMessage({ message }),
})

export const outEntries = Parent.bindChild(OutChildBlock, {
  field: 'outEntries',
  key: 'id',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
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

      return model => ({ model })
    },
  },
})
export const outEntriesInspection = Block.inspectBinding(outEntries)

export const wrappedRows = Parent.bindChild(ChildBlock, {
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
})

export const room = Parent.bindChild(ChildBlock, {
  placement: 'room',
  readAll: model => Option.toArray(model.maybeRoom),
  key: child => child.id,
  read: child => child,
  writeAt: (model, _roomId, nextRoom) =>
    Struct.modifyFields(model, { maybeRoom: () => Option.some(nextRoom) }),
  toParentMessage: (roomId, message) =>
    ParentMessage.GotRoomMessage({ roomId, message }),
})

export const ParentComposition = Parent.toComposition({
  children: [
    entries,
    equivalentEntries,
    suspendedEntries,
    brandedEntries,
    literalEntries,
    arrayChild,
    outEntries,
    wrappedRows,
    room,
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
      id: Schema.decodeUnknownSync(RefinedId)('branded'),
      kind: 'Child',
      count: 1,
    }),
  ],
  literalEntries: [
    RefinedKeyModel.make({
      id: Schema.decodeUnknownSync(RefinedId)('literal'),
      kind: 'Child',
      count: 1,
    }),
  ],
  arrayChild: ['initial'],
  outEntries: [ChildModel.make({ id: 'out', count: 1 })],
  wrappedRows: [],
  maybeRoom: Option.none(),
})
