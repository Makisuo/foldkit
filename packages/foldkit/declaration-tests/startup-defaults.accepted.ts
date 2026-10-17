import { Context, Effect, Layer, Option, Schema } from 'effect'
import { Block, Message, Struct, defineApplication } from 'foldkit'

export class StartupClient extends Context.Service<
  StartupClient,
  Readonly<{ value: number }>
>()('DeclarationStartupDefaults/StartupClient') {}

export const ChildModel = Schema.Struct({ count: Schema.Number })
export const ChildMessage = Message.defineMessageUnion({
  CompletedInitialization: { count: Schema.Number },
})
const DeclarationStartupDefaultChildDefinition = Block.define(
  'DeclarationStartupDefaultChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
export const FinishInitialization =
  DeclarationStartupDefaultChildDefinition.command('FinishInitialization', {
    args: { count: Schema.Number },
    messages: [ChildMessage.CompletedInitialization],
    handler: function* () {
      yield* StartupClient
      return ({ count }) =>
        Effect.succeed(ChildMessage.CompletedInitialization({ count }))
    },
  })
const FailConstruction = DeclarationStartupDefaultChildDefinition.command(
  'FailConstruction',
  {
    messages: [ChildMessage.CompletedInitialization],
  },
)
const FailChildConstructionLayer = FailConstruction.toLayer<
  never,
  'StartupUnavailable',
  never
>(Effect.fail<'StartupUnavailable'>('StartupUnavailable'))
const DeclarationStartupDefaultChildComposition =
  DeclarationStartupDefaultChildDefinition.makeComposition()
export const ChildBlock = DeclarationStartupDefaultChildComposition.makeBlock({
  init: DeclarationStartupDefaultChildComposition.makeInit(() => ({
    model: ChildModel.make({ count: 0 }),
    commands: [FinishInitialization({ count: 0 })],
  })),
  update: DeclarationStartupDefaultChildComposition.makeUpdate(
    (model, { count }) => ({
      model: Struct.modifyFields(model, { count: () => count }),
    }),
  ),
  EffectsLayer: Layer.merge(
    FinishInitialization.layer,
    FailChildConstructionLayer,
  ),
})

const DeclarationStartupDefaultArgumentChildDefinition = Block.define(
  'DeclarationStartupDefaultArgumentChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupDefaultArgumentChildComposition =
  DeclarationStartupDefaultArgumentChildDefinition.makeComposition()
export const DefaultChildBlock =
  DeclarationStartupDefaultArgumentChildComposition.makeBlock({
    init: DeclarationStartupDefaultArgumentChildComposition.makeInit(
      (count = 1) => ({
        model: ChildModel.make({ count }),
      }),
    ),
    update: DeclarationStartupDefaultArgumentChildComposition.makeUpdate(
      model => ({
        model,
      }),
    ),
  })

const DeclarationStartupOptionalArgumentChildDefinition = Block.define(
  'DeclarationStartupOptionalArgumentChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupOptionalArgumentChildComposition =
  DeclarationStartupOptionalArgumentChildDefinition.makeComposition()
export const OptionalChildBlock =
  DeclarationStartupOptionalArgumentChildComposition.makeBlock({
    init: DeclarationStartupOptionalArgumentChildComposition.makeInit(
      (count?: number) => ({
        model: ChildModel.make({ count: count ?? 2 }),
      }),
    ),
    update: DeclarationStartupOptionalArgumentChildComposition.makeUpdate(
      model => ({ model }),
    ),
  })

const DeclarationStartupRequiredRestChildDefinition = Block.define(
  'DeclarationStartupRequiredRestChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupRequiredRestChildComposition =
  DeclarationStartupRequiredRestChildDefinition.makeComposition()
export const RestChildBlock =
  DeclarationStartupRequiredRestChildComposition.makeBlock({
    init: DeclarationStartupRequiredRestChildComposition.makeInit(
      (first: number, ...rest: Array<number>) => ({
        model: ChildModel.make({ count: first + rest.length }),
      }),
    ),
    update: DeclarationStartupRequiredRestChildComposition.makeUpdate(
      model => ({
        model,
      }),
    ),
  })

const DeclarationStartupRequiredChildDefinition = Block.define(
  'DeclarationStartupRequiredChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupRequiredChildComposition =
  DeclarationStartupRequiredChildDefinition.makeComposition()
export const RequiredChildBlock =
  DeclarationStartupRequiredChildComposition.makeBlock({
    init: DeclarationStartupRequiredChildComposition.makeInit(
      (count: number) => ({
        model: ChildModel.make({ count }),
      }),
    ),
    update: DeclarationStartupRequiredChildComposition.makeUpdate(model => ({
      model,
    })),
  })

export const Entry = Schema.Struct({ id: Schema.String, child: ChildModel })
export const Startup = Schema.Struct({
  count: Schema.Number,
  includeOptional: Schema.Boolean,
  entryIds: Schema.Array(Schema.String),
})
export const ParentModel = Schema.Struct({
  automatic: ChildModel,
  defaultArgument: ChildModel,
  optionalArgument: ChildModel,
  requiredRest: ChildModel,
  optedOut: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  entries: Schema.Array(Entry),
  status: Schema.Literals(['Ready', 'Stepped']),
})
export const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildBlock.Message },
  GotDefaultArgumentMessage: { message: ChildBlock.Message },
  GotOptionalArgumentMessage: { message: ChildBlock.Message },
  GotRequiredRestMessage: { message: ChildBlock.Message },
  GotOptedOutMessage: { message: ChildBlock.Message },
  GotOptionalChildMessage: { message: ChildBlock.Message },
  GotEntryMessage: { id: Schema.String, message: ChildBlock.Message },
  CompletedParentInitialization: {},
  CompletedParentStep: {},
})
export const DeclarationStartupDefaultsParentDefinition = Block.define(
  'DeclarationStartupDefaultsParent',
  {
    Model: ParentModel,
    Message: ParentMessage,
    Startup,
  },
)
// oxlint-disable-next-line foldkit/command-binding-matches-name -- Two owners intentionally declare the same local Command name.
export const FinishParentInitialization =
  DeclarationStartupDefaultsParentDefinition.command('FinishInitialization', {
    messages: [ParentMessage.CompletedParentInitialization],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.CompletedParentInitialization())
    },
  })
export const FinishStep = DeclarationStartupDefaultsParentDefinition.command(
  'FinishStep',
  {
    messages: [ParentMessage.CompletedParentStep],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.CompletedParentStep())
    },
  },
)
export const AutomaticBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, {
    field: 'automatic',
    parentMessage: ParentMessage.GotChildMessage,
  })
export const DefaultArgumentBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(DefaultChildBlock, {
    field: 'defaultArgument',
    parentMessage: ParentMessage.GotDefaultArgumentMessage,
  })
export const OptionalArgumentBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(OptionalChildBlock, {
    field: 'optionalArgument',
    parentMessage: ParentMessage.GotOptionalArgumentMessage,
  })
export const RequiredRestBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(RestChildBlock, {
    field: 'requiredRest',
    parentMessage: ParentMessage.GotRequiredRestMessage,

    init: { args: startup => [startup.count] },
  })
export const OptedOutBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, {
    field: 'optedOut',
    parentMessage: ParentMessage.GotOptedOutMessage,

    init: false,
  })
export const OptionalBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, {
    field: 'maybeChild',
    parentMessage: ParentMessage.GotOptionalChildMessage,

    init: {
      args: startup =>
        startup.includeOptional ? Option.some([]) : Option.none(),
    },
  })
export const EntriesBinding =
  DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, {
    field: 'entries',
    key: 'id',
    childField: 'child',
    toParentMessage: (id, message) =>
      ParentMessage.GotEntryMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotEntryMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    init: {
      occurrences: startup =>
        startup.entryIds.map(id => ({ key: id, args: [] })),
      toItem: ({ key }, child) => ({ id: key, child }),
    },
  })
export const DeclarationStartupDefaultsParentComposition =
  DeclarationStartupDefaultsParentDefinition.makeComposition({
    childBindings: [
      AutomaticBinding,
      DefaultArgumentBinding,
      OptionalArgumentBinding,
      RequiredRestBinding,
      OptedOutBinding,
      OptionalBinding,
      EntriesBinding,
    ],
  })
const applyParentStep = DeclarationStartupDefaultsParentDefinition.step(
  model => ({
    model: Struct.modifyFields(model, { status: () => 'Stepped' }),
    commands: [FinishStep()],
  }),
)
export const initialize = DeclarationStartupDefaultsParentComposition.makeInit(
  (startup: typeof Startup.Type) => ({
    startup,
    model: {
      optedOut: ChildModel.make({ count: 9 }),
      status: 'Ready',
    },
    commands: [FinishParentInitialization()],
    steps: [applyParentStep],
  }),
)
export const ParentBlock =
  DeclarationStartupDefaultsParentComposition.makeBlock({
    init: initialize,
    update: DeclarationStartupDefaultsParentComposition.makeUpdate(model => ({
      model,
    })),
    EffectsLayer: Layer.merge(
      FinishParentInitialization.layer,
      FinishStep.layer,
    ),
  })

const SingleChildParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildBlock.Message },
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- The early identity and its specialized contracts coexist in this fixture.
export const GenericOwnerDefinition = Block.define(
  'DeclarationStartupGenericParent',
)
export const DeclarationStartupGenericParentDefinition =
  GenericOwnerDefinition.define({
    Model: Schema.Struct({ child: ChildModel }),
    Message: SingleChildParentMessage,
    Startup,
  })
export const GenericBinding =
  DeclarationStartupGenericParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: _startup => [] },
  })
export const WiderBinding = DeclarationStartupGenericParentDefinition.bindChild(
  ChildBlock,
  {
    field: 'child',
    placement: 'wider',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: (_startup: object) => [] },
  },
)
export const DeclarationStartupGenericParentComposition =
  DeclarationStartupGenericParentDefinition.makeComposition({
    childBindings: [WiderBinding],
  })
export const initializeWithoutSelectorStartup =
  DeclarationStartupGenericParentDefinition.makeComposition({
    childBindings: [
      DeclarationStartupGenericParentDefinition.bindChild(ChildBlock, {
        field: 'child',
        parentMessage: ParentMessage.GotChildMessage,
        init: { args: () => [] },
      }),
    ],
  }).makeInit(() => ({ model: {} }))

export const ForeignStartup = Schema.Struct({ token: Schema.String })
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture compares two Startup contracts under the same Block identity.
export const ForeignGenericParentDefinition = GenericOwnerDefinition.define({
  Model: DeclarationStartupGenericParentDefinition.Model,
  Message: SingleChildParentMessage,
  Startup: ForeignStartup,
})
export const ForeignGenericBinding = ForeignGenericParentDefinition.bindChild(
  ChildBlock,
  {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: _startup => [] },
  },
)

export const ApplicationDefinition = defineApplication({
  Model: Schema.Struct({ child: ChildModel }),
  Message: SingleChildParentMessage,
  Startup,
})
export const ApplicationBinding = ApplicationDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  init: { args: _startup => [] },
})

export const DeclarationStartupOrdinaryParentDefinition = Block.define(
  'DeclarationStartupOrdinaryParent',
  {
    Model: Schema.Struct({ child: ChildModel }),
    Message: SingleChildParentMessage,
  },
)
export const OrdinaryBinding =
  DeclarationStartupOrdinaryParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
  })

const SharedStartupModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
})
const CompatibleParentMessage = Message.defineMessageUnion({
  GotFirstMessage: { message: ChildBlock.Message },
  GotSecondMessage: { message: ChildBlock.Message },
})
const DeclarationCompatibleStartupParentDefinition = Block.define(
  'DeclarationCompatibleStartupParent',
  {
    Model: SharedStartupModel,
    Message: CompatibleParentMessage,
  },
)
const CountStartupBinding =
  DeclarationCompatibleStartupParentDefinition.bindChild(ChildBlock, {
    field: 'first',
    parentMessage: CompatibleParentMessage.GotFirstMessage,

    init: { args: (_startup: Readonly<{ count: number }>) => [] },
  })
const LabelStartupBinding =
  DeclarationCompatibleStartupParentDefinition.bindChild(ChildBlock, {
    field: 'second',
    parentMessage: CompatibleParentMessage.GotSecondMessage,

    init: { args: (_startup: Readonly<{ label: string }>) => [] },
  })
export const DeclarationCompatibleStartupParentComposition =
  DeclarationCompatibleStartupParentDefinition.makeComposition({
    childBindings: [CountStartupBinding, LabelStartupBinding],
  })
export const initializeCompatibleStartup =
  DeclarationCompatibleStartupParentComposition.makeInit(
    (startup: Readonly<{ count: number; label: string }>) => ({
      startup,
      model: {},
    }),
  )

const DeclarationMixedStartupParentDefinition = Block.define(
  'DeclarationMixedStartupParent',
  {
    Model: SharedStartupModel,
    Message: CompatibleParentMessage,
  },
)
const NoInputBinding = DeclarationMixedStartupParentDefinition.bindChild(
  ChildBlock,
  {
    field: 'first',
    parentMessage: CompatibleParentMessage.GotFirstMessage,

    init: { args: () => [] },
  },
)
const ContextInputBinding = DeclarationMixedStartupParentDefinition.bindChild(
  ChildBlock,
  {
    field: 'second',
    parentMessage: CompatibleParentMessage.GotSecondMessage,

    init: { args: (_startup: Readonly<{ count: number }>) => [] },
  },
)
export const DeclarationMixedStartupParentComposition =
  DeclarationMixedStartupParentDefinition.makeComposition({
    childBindings: [NoInputBinding, ContextInputBinding],
  })
export const initializeMixedStartup =
  DeclarationMixedStartupParentComposition.makeInit(
    (startup: Readonly<{ count: number }>) => ({ startup, model: {} }),
  )
