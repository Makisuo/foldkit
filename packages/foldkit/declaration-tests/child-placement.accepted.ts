import { Option, Schema } from 'effect'

import { Block, Message, Struct } from '../src/index.js'

export const ChildModel = Schema.Struct({ value: Schema.String })
export const ChildMessage = Message.defineMessageUnion({
  UpdatedValue: { value: Schema.String },
})

const Child = Block.define('DeclarationChildPlacementChild', {
  Model: ChildModel,
  Message: ChildMessage,
})

export const ChildBlock = Child.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ value: '' }) }),
  update: Child.update(model => ({ model })),
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

export const primary = Parent.bindChild(ChildBlock, {
  field: 'primary',
  toParentMessage: message => message,
})

export const secondary = Parent.bindChild(ChildBlock, {
  field: 'secondary',
  placement: 'secondaryPlacement',
  toParentMessage: message => message,
})

export const optional = Parent.bindChild(ChildBlock, {
  placement: 'optional',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    Struct.modifyFields(model, {
      maybeChild: () => Option.some(nextChild),
    }),
  toParentMessage: message => message,
})

export const entries = Parent.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

export const ParentComposition = Parent.toComposition({
  children: [primary, secondary, optional, entries],
})

export const composeDynamicChildren = (
  children: ReadonlyArray<typeof primary>,
) => Parent.toComposition({ children })
