import { Option, Schema } from 'effect'
import { Block, Message, Struct } from 'foldkit'
import { taggedStruct } from 'foldkit/schema'

export const ChildModel = Schema.Struct({ count: Schema.Number })
export const ChildMessage = Message.defineMessageUnion({
  UpdatedCount: { count: Schema.Number },
})
const Child = Block.define('DeclaredDirectFieldChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const setCount = Child.step((model, count: number) => ({
  model: Struct.modifyFields(model, { count: () => count }),
}))
export const childBlock = Child.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: Child.update((model, { count }) => setCount(model, count)),
  expose: { setCount },
})
export const NestedOptionChildModel = Schema.Option(ChildModel)
const NestedOptionChild = Block.define('DeclaredNestedOptionChild', {
  Model: NestedOptionChildModel,
  Message: ChildMessage,
})
export const nestedOptionChildBlock = NestedOptionChild.toComposition().toBlock(
  {
    init: () => ({ model: Option.none() }),
    update: NestedOptionChild.update(model => ({ model })),
  },
)
export const ArrayChildModel = Schema.Array(Schema.String)
const ArrayChild = Block.define('DeclaredArrayChild', {
  Model: ArrayChildModel,
  Message: ChildMessage,
})
export const arrayChildBlock = ArrayChild.toComposition().toBlock({
  init: () => ({ model: ArrayChildModel.make([]) }),
  update: ArrayChild.update(model => ({ model })),
})
export const Model = Schema.Struct({
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  suspendedMaybeChild: Schema.suspend(() => Schema.Option(ChildModel)),
  nestedChild: NestedOptionChildModel,
  maybeNestedChild: Schema.Option(NestedOptionChildModel),
  arrayChild: ArrayChildModel,
  route: Schema.Literals(['Home', 'Away']),
})
export const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  IgnoredChildMessage: {},
  GotOptionalExtraMessage: {
    message: ChildMessage,
    requestId: Schema.optionalKey(Schema.String),
  },
})
export const Parent = Block.define('DeclaredDirectFieldParent', {
  Model,
  Message: ParentMessage,
})
export const required = Parent.bindChild(childBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
export const optional = Parent.bindChild(childBlock, {
  field: 'maybeChild',
  presentWhen: model => model.route === 'Home',
  parentMessage: ParentMessage.GotChildMessage,
})
export const suspendedOptional = Parent.bindChild(childBlock, {
  field: 'suspendedMaybeChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const nestedRequired = Parent.bindChild(nestedOptionChildBlock, {
  field: 'nestedChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const nestedOptional = Parent.bindChild(nestedOptionChildBlock, {
  field: 'maybeNestedChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const arrayChild = Parent.bindChild(arrayChildBlock, {
  field: 'arrayChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const customIgnoredMessage = Parent.bindChild(childBlock, {
  placement: 'customIgnoredMessage',
  field: 'child',
  toParentMessage: () => ParentMessage.IgnoredChildMessage(),
})
export const composition = Parent.toComposition({
  children: [
    required,
    optional,
    suspendedOptional,
    nestedRequired,
    nestedOptional,
    arrayChild,
    customIgnoredMessage,
  ],
})
export const initial = Model.make({
  child: ChildModel.make({ count: 1 }),
  maybeChild: Option.none(),
  suspendedMaybeChild: Option.none(),
  nestedChild: Option.none(),
  maybeNestedChild: Option.none(),
  arrayChild: [],
  route: 'Home',
})
const result = optional.setCount(2)(initial)
const folded = optional.fold(initial, ChildMessage.UpdatedCount({ count: 2 }))
void result
void folded
export const custom = Parent.bindChild(childBlock, {
  placement: 'custom',
  read: model =>
    model.route === 'Home' ? Option.some(model.child) : Option.none(),
  write: (model, nextChild) =>
    Struct.modifyFields(model, { child: () => nextChild }),
  parentMessage: ParentMessage.GotChildMessage,
})

export const CallableModel = taggedStruct('DeclaredCallableParent', {
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
})
const CallableParent = Block.define('DeclaredCallableFieldParent', {
  Model: CallableModel,
  Message: ParentMessage,
})
export const callableRequired = CallableParent.bindChild(childBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
export const callableOptional = CallableParent.bindChild(childBlock, {
  field: 'maybeChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const callableComposition = CallableParent.toComposition({
  children: [callableRequired, callableOptional],
})
