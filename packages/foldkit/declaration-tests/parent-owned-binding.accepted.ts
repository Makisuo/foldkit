import { Context, Effect, Layer, Option, Schema } from 'effect'

import { Application, Block, Message, Struct, Update } from '../src/index.js'

export class ChildClock extends Context.Service<
  ChildClock,
  Readonly<{ now: Effect.Effect<number> }>
>()('ParentOwnedBindingChildClock') {}

const ChildModel = Schema.Struct({ value: Schema.String })
const ChildMessage = Message.defineMessageUnion({
  UpdatedValue: { value: Schema.String },
  CompletedReadChildValue: { value: Schema.Number },
})
const ChildOutMessage = Message.defineMessageUnion({
  SelectedValue: { value: Schema.String },
})
const ChildDefinition = Block.define('DeclarationParentOwnedChild', {
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
const handlerConstruction: Effect.Effect<void, 'HandlerUnavailable'> =
  Effect.void
export const ReadChildValue = ChildDefinition.command('ReadChildValue', {
  messages: [ChildMessage.CompletedReadChildValue],
  handler: function* () {
    const clock = yield* ChildClock
    yield* handlerConstruction

    return () =>
      clock.now.pipe(
        Effect.map(value => ChildMessage.CompletedReadChildValue({ value })),
      )
  },
})
const ChildComposition = ChildDefinition.toComposition()
export const ChildBlock = ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: ChildDefinition.update((model, message) =>
    ChildMessage.match(message, {
      UpdatedValue: ({ value }) => ({
        model: Struct.modifyFields(model, { value: () => value }),
      }),
      CompletedReadChildValue: () => ({ model }),
    }),
  ),
  expose: {
    select: ChildDefinition.step(model => ({
      model,
      outMessage: ChildOutMessage.SelectedValue({ value: model.value }),
    })),
    refresh: ChildDefinition.step(model => ({
      model,
      commands: [ReadChildValue()],
    })),
  },
  EffectsLayer: ReadChildValue.layer,
})

const Entry = Schema.Struct({ id: Schema.Number, child: ChildModel })
const ChildSlot = Schema.TaggedStruct('Child', { child: ChildModel })
const EmptySlot = Schema.TaggedStruct('Empty', {})
const Slot = Schema.Union([ChildSlot, EmptySlot])
const ParentModel = Schema.Struct({
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  slot: Slot,
  entries: Schema.Array(Entry),
})
const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  GotEntryMessage: { id: Schema.Number, message: ChildMessage },
})
export const ParentOutMessage = Message.defineMessageUnion({
  ForwardedSelectedValue: { value: Schema.String },
})
const ParentDefinition = Block.define('DeclarationParentOwnedParent', {
  Model: ParentModel,
  Message: ParentMessage,
  OutMessage: ParentOutMessage,
})

const foldChildOutMessage = ChildOutMessage.match<
  Update.Step<typeof ParentModel.Type, typeof ParentMessage.Type>
>({
  SelectedValue: () => model => ({ model }),
})

export const directChild = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
export const directChildInspection = Block.inspectBinding(directChild)
export const forwardingChild = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  placement: 'forwardingChild',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    forward: outMessage =>
      ChildOutMessage.match<typeof ParentOutMessage.Type>(outMessage, {
        SelectedValue: ({ value }) =>
          ParentOutMessage.ForwardedSelectedValue({ value }),
      }),
  },
})

export const optionalChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'optionalChild',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    Struct.modifyFields(model, {
      maybeChild: () => Option.some(nextChild),
    }),
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  outMessage: {
    fold: (outMessage, context) => {
      const exactOutMessage: typeof ChildOutMessage.Type = outMessage
      const exactContext: Update.FoldContext<
        typeof ChildMessage.Type,
        typeof ParentMessage.Type,
        typeof ParentModel.Type
      > = context
      void exactOutMessage
      void exactContext

      return foldChildOutMessage(outMessage)
    },
  },
})

export const taggedChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'taggedChild',
  read: model =>
    model.slot._tag === 'Child' ? Option.some(model.slot.child) : Option.none(),
  write: (model, nextChild) =>
    Struct.modifyFields(model, {
      slot: () => ChildSlot.make({ child: nextChild }),
    }),
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})

export const keyedChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  outMessage: {
    fold: (id, outMessage, context) => {
      const exactId: number = id
      const exactOutMessage: typeof ChildOutMessage.Type = outMessage
      const exactContext: Update.FoldContext<
        typeof ChildMessage.Type,
        typeof ParentMessage.Type,
        typeof ParentModel.Type
      > = context
      void exactId
      void exactOutMessage
      void exactContext

      return foldChildOutMessage(outMessage)
    },
  },
})

const ParentComposition = ParentDefinition.toComposition({
  children: [directChild, optionalChild, taggedChild, keyedChild],
})
export const ParentBlock = ParentComposition.toBlock({
  init: () => ({
    model: ParentModel.make({
      child: ChildModel.make({ value: 'initial' }),
      maybeChild: Option.none(),
      slot: EmptySlot.make({}),
      entries: [],
    }),
  }),
  update: ParentDefinition.update((model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => directChild.fold(model, message),
      GotEntryMessage: ({ id, message }) => keyedChild.fold(model, id, message),
    }),
  ),
})

const ApplicationDefinition = Application.define({
  Model: ParentModel,
  Message: ParentMessage,
})
export const applicationChild = ApplicationDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [applicationChild],
})

export const pureComposition = Block.define('DeclarationPureComposition', {
  Model: Schema.Null,
  Message: Schema.Never,
}).toComposition()
export const pureBlock = pureComposition.toBlock({
  init: () => ({ model: null }),
  update: pureComposition.update(model => ({ model })),
})

export const emptyLayer = Layer.empty
