import { Option, Schema } from 'effect'
import { Block, Message, Struct } from 'foldkit'

export const ChildModel = Schema.Struct({ value: Schema.String })
export const ChildMessage = Message.defineMessageUnion({
  UpdatedValue: { value: Schema.String },
})

const Child = Block.define('DeclarationChildPlacementChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ChildComposition = Child.toComposition()

export const ChildBlock = ChildComposition.toBlock({
  init: ChildComposition.init(() => ({
    model: ChildModel.make({ value: '' }),
  })),
  update: ChildComposition.update(model => ({ model })),
})

const Entry = Schema.Struct({
  id: Schema.String,
  child: ChildModel,
})

export const ParentModel = Schema.Struct({
  primary: ChildModel,
  secondary: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  entries: Schema.Array(Entry),
})

export const Parent = Block.define('DeclarationChildPlacementParent', {
  Model: ParentModel,
  Message: ChildMessage,
})

export const PrimaryBinding = Parent.bindChild(ChildBlock, {
  field: 'primary',
  toParentMessage: message => message,
  fromParentMessage: false,
})

export const SecondaryBinding = Parent.bindChild(ChildBlock, {
  field: 'secondary',
  placement: 'secondaryPlacement',
  toParentMessage: message => message,
  fromParentMessage: false,
})

export const OptionalBinding = Parent.bindChild(ChildBlock, {
  placement: 'optional',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    Struct.modifyFields(model, {
      maybeChild: () => Option.some(nextChild),
    }),
  toParentMessage: message => message,
  fromParentMessage: false,
})

export const EntriesBinding = Parent.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
  fromParentMessage: false,
})

export const DefaultAccessorBinding = Parent.bindChild(ChildBlock, {
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    Struct.modifyFields(model, {
      maybeChild: () => Option.some(nextChild),
    }),
  toParentMessage: message => message,
  fromParentMessage: false,
})

export const EntriesByIdBinding = Parent.bindChild(ChildBlock, {
  placement: 'entriesById',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
  fromParentMessage: false,
})

export const EntriesByIdLengthBinding = Parent.bindChild(ChildBlock, {
  placement: 'entriesByIdLength',
  readAll: model => model.entries,
  key: entry => entry.id.length,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_idLength, message) => message,
  fromParentMessage: false,
})

export const ParentComposition = Parent.toComposition({
  childBindings: [
    PrimaryBinding,
    SecondaryBinding,
    OptionalBinding,
    EntriesBinding,
  ],
})

export const DefaultPlacementComposition = Parent.toComposition({
  childBindings: [
    DefaultAccessorBinding,
    EntriesByIdBinding,
    EntriesByIdLengthBinding,
  ],
})

export const composeDynamicChildren = (
  childBindings: ReadonlyArray<typeof PrimaryBinding>,
) => Parent.toComposition({ childBindings })
