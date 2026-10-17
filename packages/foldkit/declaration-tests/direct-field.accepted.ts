import { Layer, Option, Schema } from 'effect'
import { Block, Message, Struct } from 'foldkit'
import { taggedStruct } from 'foldkit/schema'

export const ChildModel = Schema.Struct({ count: Schema.Number })
export const ChildMessage = Message.defineMessageUnion({
  UpdatedCount: { count: Schema.Number },
})
// eslint-disable-next-line foldkit/block-name-matches-variable
const ChildDefinition = Block.define('DeclaredDirectFieldChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const setCount = ChildDefinition.step((model, count: number) => ({
  model: Struct.modifyFields(model, { count: () => count }),
}))
const DeclaredDirectFieldChildComposition = ChildDefinition.makeComposition()
const childUpdate = DeclaredDirectFieldChildComposition.makeUpdate(
  (model, { count }) => setCount(model, count),
)
export const childBlock = DeclaredDirectFieldChildComposition.makeBlock({
  init: DeclaredDirectFieldChildComposition.makeInit(() => ({
    model: ChildModel.make({ count: 0 }),
  })),
  update: childUpdate,
  operations: {
    setCount: (count: number) => [ChildMessage.UpdatedCount({ count })],
  },
  EffectsLayer: Layer.empty,
})
export const argumentChildBlock = DeclaredDirectFieldChildComposition.makeBlock(
  {
    init: DeclaredDirectFieldChildComposition.makeInit((count: number) => ({
      model: ChildModel.make({ count }),
    })),
    update: childUpdate,
    operations: {
      setCount: (count: number) => [ChildMessage.UpdatedCount({ count })],
    },
    EffectsLayer: Layer.empty,
  },
)
export const NestedOptionChildModel = Schema.Option(ChildModel)
// eslint-disable-next-line foldkit/block-name-matches-variable
const NestedOptionChildDefinition = Block.define('DeclaredNestedOptionChild', {
  Model: NestedOptionChildModel,
  Message: ChildMessage,
})
const DeclaredNestedOptionChildComposition =
  NestedOptionChildDefinition.makeComposition()
export const nestedOptionChildBlock =
  DeclaredNestedOptionChildComposition.makeBlock({
    init: DeclaredNestedOptionChildComposition.makeInit(() => ({
      model: Option.none(),
    })),
    update: DeclaredNestedOptionChildComposition.makeUpdate(model => ({
      model,
    })),
    EffectsLayer: Layer.empty,
  })
export const ArrayChildModel = Schema.Array(Schema.String)
// eslint-disable-next-line foldkit/block-name-matches-variable
const ArrayChildDefinition = Block.define('DeclaredArrayChild', {
  Model: ArrayChildModel,
  Message: ChildMessage,
})
const DeclaredArrayChildComposition = ArrayChildDefinition.makeComposition()
export const arrayChildBlock = DeclaredArrayChildComposition.makeBlock({
  init: DeclaredArrayChildComposition.makeInit(() => ({
    model: ArrayChildModel.make([]),
  })),
  update: DeclaredArrayChildComposition.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
export const Model = Schema.Struct({
  child: ChildModel,
  argumentChild: ChildModel,
  maybeArgumentChild: Schema.Option(ChildModel),
  maybeChild: Schema.Option(ChildModel),
  suspendedMaybeChild: Schema.suspend(() => Schema.Option(ChildModel)),
  nestedChild: NestedOptionChildModel,
  maybeNestedChild: Schema.Option(NestedOptionChildModel),
  arrayChild: ArrayChildModel,
  route: Schema.Literals(['Home', 'Away']),
})
export const ParentMessage = Message.defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage },
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotArgumentChildMessage: { message: ChildMessage },
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotOptionalArgumentChildMessage: { message: ChildMessage },
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotIgnoredChildMessage: { message: ChildMessage },
  IgnoredChildMessage: {},
})
// eslint-disable-next-line foldkit/block-name-matches-variable
export const ParentDefinition = Block.define('DeclaredDirectFieldParent', {
  Model,
  Message: ParentMessage,
})
export const RequiredBinding = ParentDefinition.bindChild(childBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
export const OptionalBinding = ParentDefinition.bindChild(childBlock, {
  field: 'maybeChild',
  presentWhen: model => model.route === 'Home',
  parentMessage: ParentMessage.GotChildMessage,
})
export const SuspendedOptionalBinding = ParentDefinition.bindChild(childBlock, {
  field: 'suspendedMaybeChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const NestedRequiredBinding = ParentDefinition.bindChild(
  nestedOptionChildBlock,
  {
    field: 'nestedChild',
    parentMessage: ParentMessage.GotChildMessage,
  },
)
export const NestedOptionalBinding = ParentDefinition.bindChild(
  nestedOptionChildBlock,
  {
    field: 'maybeNestedChild',
    parentMessage: ParentMessage.GotChildMessage,
  },
)
export const ArrayChildBinding = ParentDefinition.bindChild(arrayChildBlock, {
  field: 'arrayChild',
  parentMessage: ParentMessage.GotChildMessage,
})
export const CustomIgnoredMessageBinding = ParentDefinition.bindChild(
  childBlock,
  {
    placement: 'customIgnoredMessage',
    field: 'suspendedMaybeChild',
    toParentMessage: message =>
      ParentMessage.GotIgnoredChildMessage({ message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotIgnoredChildMessage,
      args: (_model, { message }) => Option.some([message]),
    },
  },
)
export const InitializedRequiredBinding = ParentDefinition.bindChild(
  childBlock,
  {
    field: 'child',
    placement: 'initializedRequired',
    parentMessage: ParentMessage.GotChildMessage,
    init: true,
  },
)
export const InitializedArgumentBinding = ParentDefinition.bindChild(
  argumentChildBlock,
  {
    field: 'argumentChild',
    parentMessage: ParentMessage.GotArgumentChildMessage,
    init: {
      args: (context: InitializationContext) => [context.count],
    },
  },
)
export const InitializedOptionalBinding = ParentDefinition.bindChild(
  argumentChildBlock,
  {
    field: 'maybeArgumentChild',
    parentMessage: ParentMessage.GotOptionalArgumentChildMessage,
    init: {
      args: (context: InitializationContext) => {
        if (Option.isSome(context.maybeCount)) {
          return Option.some([context.maybeCount.value])
        }

        return Option.none()
      },
    },
  },
)
export const NativeTupleOptionalBinding = ParentDefinition.bindChild(
  argumentChildBlock,
  {
    field: 'maybeArgumentChild',
    placement: 'nativeTupleOptional',
    parentMessage: ParentMessage.GotChildMessage,
    init: {
      args: (context: Readonly<{ count: number }>) =>
        Option.some([context.count]),
    },
  },
)
export const InitializedCustomBinding = ParentDefinition.bindChild(
  argumentChildBlock,
  {
    placement: 'initializedCustom',
    read: model => Option.some(model.argumentChild),
    write: (model, nextChild) =>
      Struct.modifyFields(model, { argumentChild: () => nextChild }),
    parentMessage: ParentMessage.GotChildMessage,
    init: {
      args: (context: InitializationContext) => [context.count],
      model: childModel => ({ argumentChild: childModel }),
    },
  },
)
// eslint-disable-next-line foldkit/block-name-matches-variable
export const initialComposition = ParentDefinition.makeComposition({
  childBindings: [
    InitializedRequiredBinding,
    InitializedArgumentBinding,
    InitializedOptionalBinding,
    CustomIgnoredMessageBinding,
  ],
})
export type InitializationContext = Readonly<{
  count: number
  maybeCount: Option.Option<number>
}>
export const initialize = initialComposition.makeInit(
  (context: InitializationContext) => ({
    startup: context,
    model: {
      maybeChild: Option.none(),
      suspendedMaybeChild: Option.none(),
      nestedChild: Option.none(),
      maybeNestedChild: Option.none(),
      arrayChild: [],
      route: 'Home',
    },
  }),
)
export const initializedBlock = initialComposition.makeBlock({
  init: initialize,
  update: initialComposition.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
// eslint-disable-next-line foldkit/block-name-matches-variable
export const composition = ParentDefinition.makeComposition({
  childBindings: [
    RequiredBinding,
    InitializedArgumentBinding,
    InitializedOptionalBinding,
    CustomIgnoredMessageBinding,
  ],
})
export const initial = Model.make({
  child: ChildModel.make({ count: 1 }),
  argumentChild: ChildModel.make({ count: 2 }),
  maybeArgumentChild: Option.none(),
  maybeChild: Option.none(),
  suspendedMaybeChild: Option.none(),
  nestedChild: Option.none(),
  maybeNestedChild: Option.none(),
  arrayChild: [],
  route: 'Home',
})
const DeclaredDirectFieldParentComposition = ParentDefinition.makeComposition({
  childBindings: [
    OptionalBinding,
    InitializedArgumentBinding,
    InitializedOptionalBinding,
    CustomIgnoredMessageBinding,
  ],
})
export const setOptionalCount = DeclaredDirectFieldParentComposition.makeUpdate(
  (model, _message, count: number) => OptionalBinding.setCount(count)(model),
)
export const foldOptional = DeclaredDirectFieldParentComposition.makeUpdate(
  (model, _message, childMessage: typeof ChildMessage.Type) =>
    OptionalBinding.fold(model, childMessage),
)
const result = setOptionalCount(initial, ParentMessage.IgnoredChildMessage(), 2)
const folded = foldOptional(
  initial,
  ParentMessage.IgnoredChildMessage(),
  ChildMessage.UpdatedCount({ count: 2 }),
)
void result
void folded
export const CustomBinding = ParentDefinition.bindChild(childBlock, {
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
const CallableParentMessage = Message.defineMessageUnion({
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotChildMessage: { message: ChildMessage },
  IgnoredChildMessage: {},
})
// eslint-disable-next-line foldkit/block-name-matches-variable
const CallableParentDefinition = Block.define('DeclaredCallableFieldParent', {
  Model: CallableModel,
  Message: CallableParentMessage,
})
export const CallableRequiredBinding = CallableParentDefinition.bindChild(
  childBlock,
  {
    field: 'child',
    parentMessage: CallableParentMessage.GotChildMessage,
  },
)
export const CallableOptionalBinding = CallableParentDefinition.bindChild(
  childBlock,
  {
    field: 'maybeChild',
    parentMessage: CallableParentMessage.GotChildMessage,
  },
)
// eslint-disable-next-line foldkit/block-name-matches-variable
export const callableComposition = CallableParentDefinition.makeComposition({
  childBindings: [CallableRequiredBinding],
})
export const setCallableCount = callableComposition.makeUpdate(
  (model, _message, count: number) =>
    CallableRequiredBinding.setCount(count)(model),
)
