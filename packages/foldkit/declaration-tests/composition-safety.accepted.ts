import { Array, Effect, Layer, Option, Schema } from 'effect'
import { Block, Command, Message, Struct, Update } from 'foldkit'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? (<Value>() => Value extends Right ? 1 : 2) extends <
        Value,
      >() => Value extends Left ? 1 : 2
      ? true
      : false
    : false
type Expect<Value extends true> = Value

export const ChildModel = Schema.Struct({ count: Schema.Number })
export type ChildModel = typeof ChildModel.Type
export const ChildMessage = Message.defineMessageUnion({ Incremented: {} })
export type ChildMessage = typeof ChildMessage.Type

declare const plainUpdate: Block.DefinedUpdate<
  ChildModel,
  ChildMessage,
  readonly [],
  never,
  never,
  never
>
declare const optionalContextUpdate: Block.DefinedUpdate<
  ChildModel,
  ChildMessage,
  readonly [context?: Readonly<{ amount: number }>],
  never,
  never,
  never
>
declare const restContextUpdate: Block.DefinedUpdate<
  ChildModel,
  ChildMessage,
  readonly [context: Readonly<{ amount: number }>],
  never,
  never,
  never
>

const CompositionSafetyPlain = Block.define('CompositionSafetyPlain', {
  Model: ChildModel,
  Message: ChildMessage,
})
const CompositionSafetyPlainComposition = CompositionSafetyPlain.toComposition()
export const PlainBlock = CompositionSafetyPlainComposition.toBlock({
  init: CompositionSafetyPlainComposition.init(() => ({
    model: ChildModel.make({ count: 0 }),
  })),
  update: plainUpdate,
  EffectsLayer: Layer.empty,
})

const CompositionSafetyOptionalContext = Block.define(
  'CompositionSafetyOptionalContext',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const CompositionSafetyOptionalContextComposition =
  CompositionSafetyOptionalContext.toComposition()
export const OptionalContextBlock =
  CompositionSafetyOptionalContextComposition.toBlock({
    init: CompositionSafetyOptionalContextComposition.init(() => ({
      model: ChildModel.make({ count: 0 }),
    })),
    update: optionalContextUpdate,
    EffectsLayer: Layer.empty,
  })

const CompositionSafetyRestContext = Block.define(
  'CompositionSafetyRestContext',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const CompositionSafetyRestContextComposition =
  CompositionSafetyRestContext.toComposition()
export const RestContextBlock = CompositionSafetyRestContextComposition.toBlock(
  {
    init: CompositionSafetyRestContextComposition.init(() => ({
      model: ChildModel.make({ count: 0 }),
    })),
    update: restContextUpdate,
    EffectsLayer: Layer.empty,
  },
)

export const ParameterizedChildModel = Schema.Struct({ count: Schema.Number })
export const ParameterizedChildMessage = Message.defineMessageUnion({
  CompletedLoad: {},
})
const CompositionSafetyParameterized = Block.define(
  'CompositionSafetyParameterized',
  {
    Model: ParameterizedChildModel,
    Message: ParameterizedChildMessage,
  },
)
export const LoadParameterizedChild = CompositionSafetyParameterized.command(
  'LoadParameterizedChild',
  {
    messages: [ParameterizedChildMessage.CompletedLoad],
    handler: function* () {
      return () => Effect.succeed(ParameterizedChildMessage.CompletedLoad())
    },
  },
)
const CompositionSafetyParameterizedComposition =
  CompositionSafetyParameterized.toComposition()
export const ParameterizedBlock =
  CompositionSafetyParameterizedComposition.toBlock({
    init: CompositionSafetyParameterizedComposition.init((count: number) => ({
      model: ParameterizedChildModel.make({ count }),
      commands: [LoadParameterizedChild()],
    })),
    update: CompositionSafetyParameterizedComposition.update(model => ({
      model,
    })),
    EffectsLayer: LoadParameterizedChild.layer,
  })

export const Entry = Schema.Struct({
  id: Schema.String,
  child: ParameterizedChildModel,
})

export const ParentModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
  plain: ChildModel,
  optionalContext: ChildModel,
  restContext: ChildModel,
  entries: Schema.Array(Entry),
})
export const ParentMessage = Message.defineMessageUnion({
  RoutedProjectedMessage: { message: ChildMessage },
  RoutedPlainMessage: { message: ChildMessage },
  RoutedParentCommandMessage: { message: ChildMessage },
  RoutedOptionalContextMessage: { message: ChildMessage },
  RoutedRestContextMessage: { message: ChildMessage },
  RoutedEntryMessage: {
    id: Schema.String,
    message: ParameterizedChildMessage,
  },
})
export const CompositionSafetyParent = Block.define('CompositionSafetyParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

export const StableProjectedBinding = CompositionSafetyParent.bindChild(
  PlainBlock,
  {
    placement: 'stableProjected',
    read: model => Option.some(model.first),
    write: (model, nextChild) =>
      Struct.modifyFields(model, { first: () => nextChild }),
    parentMessage: ParentMessage.RoutedProjectedMessage,
    init: {
      args: () => [],
      model: child => ({ first: child }),
    },
  },
)
export const PlainBinding = CompositionSafetyParent.bindChild(PlainBlock, {
  field: 'plain',
  parentMessage: ParentMessage.RoutedPlainMessage,
  init: false,
})
export const ParentCommandsBinding = CompositionSafetyParent.bindChild(
  PlainBlock,
  {
    placement: 'parentCommands',
    read: model => Option.some(model.plain),
    write: (model, nextChild) =>
      Struct.modifyFields(model, { plain: () => nextChild }),
    toParentMessage: message =>
      ParentMessage.RoutedParentCommandMessage({ message }),
    fromParentMessage: false,
  },
)
export const OptionalContextBinding = CompositionSafetyParent.bindChild(
  OptionalContextBlock,
  {
    field: 'optionalContext',
    parentMessage: ParentMessage.RoutedOptionalContextMessage,
    fromParentMessage: {
      args: (_model, { message }) => Option.some([message]),
    },
  },
)
export const RestContextBinding = CompositionSafetyParent.bindChild(
  RestContextBlock,
  {
    field: 'restContext',
    parentMessage: ParentMessage.RoutedRestContextMessage,
    fromParentMessage: {
      args: (_model, { message }) => Option.some([message, { amount: 1 }]),
    },
  },
)
export const EntryBinding = CompositionSafetyParent.bindChild(
  ParameterizedBlock,
  {
    field: 'entries',
    key: 'id',
    childField: 'child',
    toParentMessage: (id, message) =>
      ParentMessage.RoutedEntryMessage({ id, message }),
    fromParentMessage: false,
  },
)

export const initialParentModel = ParentModel.make({
  first: ChildModel.make({ count: 0 }),
  second: ChildModel.make({ count: 0 }),
  plain: ChildModel.make({ count: 0 }),
  optionalContext: ChildModel.make({ count: 0 }),
  restContext: ChildModel.make({ count: 0 }),
  entries: [],
})

const plainInitializerDocumentation = PlainBinding.init({
  args: [],
  toParentModel: child =>
    Struct.modifyFields(initialParentModel, { plain: () => child }),
})
const keyedInitializerDocumentation = EntryBinding.init({
  key: 'documented-entry',
  args: [0],
  toParentModel: child =>
    Struct.modifyFields(initialParentModel, {
      entries: Array.append(Entry.make({ id: 'documented-entry', child })),
    }),
})
void plainInitializerDocumentation
void keyedInitializerDocumentation

export const initializePlain = CompositionSafetyParent.step(model =>
  PlainBinding.init({
    args: [],
    toParentModel: child => Struct.modifyFields(model, { plain: () => child }),
  }),
)
export const initializeEntry = CompositionSafetyParent.step(
  (model, id: string, count: number) =>
    EntryBinding.init({
      key: id,
      args: [count],
      toParentModel: child =>
        Struct.modifyFields(model, {
          entries: Array.append(Entry.make({ id, child })),
        }),
    }),
)
export const initializePlainWithParentCommands = CompositionSafetyParent.step(
  model => {
    const entryInit = EntryBinding.init({
      key: 'parent-command-entry',
      args: [1],
      toParentModel: child =>
        Struct.modifyFields(model, {
          entries: Array.append(
            Entry.make({ id: 'parent-command-entry', child }),
          ),
        }),
    })
    const parentCommands = Command.mapMessages(entryInit.commands, () =>
      ParentMessage.RoutedParentCommandMessage({
        message: ChildMessage.Incremented(),
      }),
    )

    return ParentCommandsBinding.init({
      args: [],
      toParentModel: child =>
        Struct.modifyFields(entryInit.model, { plain: () => child }),
      commands: parentCommands,
    })
  },
)

export const CompositionSafetyParentComposition =
  CompositionSafetyParent.toComposition({
    childBindings: [PlainBinding, ParentCommandsBinding, EntryBinding],
  })
export const StrictBlock = CompositionSafetyParentComposition.toBlock({
  init: CompositionSafetyParentComposition.init(() => ({
    model: initialParentModel,
  })),
  update: CompositionSafetyParentComposition.update(model => ({ model })),
  expose: {
    initializeEntry,
    initializePlain,
    initializePlainWithParentCommands,
  },
  EffectsLayer: LoadParameterizedChild.layer,
})

type EntryInitRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof initializeEntry>,
    Block.Qualify<'entries', Command.HandlerOf<typeof LoadParameterizedChild>>
  >
>
type ParentCommandRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof initializePlainWithParentCommands>,
    Block.Qualify<'entries', Command.HandlerOf<typeof LoadParameterizedChild>>
  >
>
type ParentCommandRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<
      ReturnType<typeof initializePlainWithParentCommands>
    >,
    | Block.BindingRequirement<'parentCommands', typeof PlainBlock>
    | Block.BindingRequirement<'entries', typeof ParameterizedBlock>
  >
>
type EntryInitModelIsExact = Expect<
  Equal<ReturnType<typeof initializeEntry>['model'], typeof ParentModel.Type>
>

export const initialize = CompositionSafetyParent.toComposition({
  childBindings: [StableProjectedBinding],
}).init(() => ({
  model: {
    second: ChildModel.make({ count: 0 }),
    plain: ChildModel.make({ count: 0 }),
    optionalContext: ChildModel.make({ count: 0 }),
    restContext: ChildModel.make({ count: 0 }),
    entries: [],
  },
}))

export type CompositionSafetyAssertions = [
  EntryInitRequirementsAreExact,
  ParentCommandRequirementsAreExact,
  ParentCommandRegistrationIsExact,
  EntryInitModelIsExact,
]
