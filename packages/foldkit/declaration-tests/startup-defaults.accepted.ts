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
const DeclarationStartupDefaultChild = Block.define(
  'DeclarationStartupDefaultChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
export const FinishInitialization = DeclarationStartupDefaultChild.command(
  'FinishInitialization',
  {
    args: { count: Schema.Number },
    messages: [ChildMessage.CompletedInitialization],
    handler: function* () {
      yield* StartupClient
      return ({ count }) =>
        Effect.succeed(ChildMessage.CompletedInitialization({ count }))
    },
  },
)
const FailConstruction = DeclarationStartupDefaultChild.command(
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
  DeclarationStartupDefaultChild.toComposition()
export const ChildBlock = DeclarationStartupDefaultChildComposition.toBlock({
  init: DeclarationStartupDefaultChildComposition.init(() => ({
    model: ChildModel.make({ count: 0 }),
    commands: [FinishInitialization({ count: 0 })],
  })),
  update: DeclarationStartupDefaultChildComposition.update(
    (model, { count }) => ({
      model: Struct.modifyFields(model, { count: () => count }),
    }),
  ),
  EffectsLayer: Layer.merge(
    FinishInitialization.layer,
    FailChildConstructionLayer,
  ),
})

const DeclarationStartupDefaultArgumentChild = Block.define(
  'DeclarationStartupDefaultArgumentChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupDefaultArgumentChildComposition =
  DeclarationStartupDefaultArgumentChild.toComposition()
export const DefaultChildBlock =
  DeclarationStartupDefaultArgumentChildComposition.toBlock({
    init: DeclarationStartupDefaultArgumentChildComposition.init(
      (count = 1) => ({
        model: ChildModel.make({ count }),
      }),
    ),
    update: DeclarationStartupDefaultArgumentChildComposition.update(model => ({
      model,
    })),
  })

const DeclarationStartupOptionalArgumentChild = Block.define(
  'DeclarationStartupOptionalArgumentChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupOptionalArgumentChildComposition =
  DeclarationStartupOptionalArgumentChild.toComposition()
export const OptionalChildBlock =
  DeclarationStartupOptionalArgumentChildComposition.toBlock({
    init: DeclarationStartupOptionalArgumentChildComposition.init(
      (count?: number) => ({
        model: ChildModel.make({ count: count ?? 2 }),
      }),
    ),
    update: DeclarationStartupOptionalArgumentChildComposition.update(
      model => ({ model }),
    ),
  })

const DeclarationStartupRequiredRestChild = Block.define(
  'DeclarationStartupRequiredRestChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupRequiredRestChildComposition =
  DeclarationStartupRequiredRestChild.toComposition()
export const RestChildBlock =
  DeclarationStartupRequiredRestChildComposition.toBlock({
    init: DeclarationStartupRequiredRestChildComposition.init(
      (first: number, ...rest: Array<number>) => ({
        model: ChildModel.make({ count: first + rest.length }),
      }),
    ),
    update: DeclarationStartupRequiredRestChildComposition.update(model => ({
      model,
    })),
  })

const DeclarationStartupRequiredChild = Block.define(
  'DeclarationStartupRequiredChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
const DeclarationStartupRequiredChildComposition =
  DeclarationStartupRequiredChild.toComposition()
export const RequiredChildBlock =
  DeclarationStartupRequiredChildComposition.toBlock({
    init: DeclarationStartupRequiredChildComposition.init((count: number) => ({
      model: ChildModel.make({ count }),
    })),
    update: DeclarationStartupRequiredChildComposition.update(model => ({
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
  CompletedParentInitialization: {},
  CompletedParentStep: {},
})
export const DeclarationStartupDefaultsParent = Block.define(
  'DeclarationStartupDefaultsParent',
  {
    Model: ParentModel,
    Message: ParentMessage,
    Startup,
  },
)
// oxlint-disable-next-line foldkit/command-binding-matches-name -- Two owners intentionally declare the same local Command name.
export const FinishParentInitialization =
  DeclarationStartupDefaultsParent.command('FinishInitialization', {
    messages: [ParentMessage.CompletedParentInitialization],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.CompletedParentInitialization())
    },
  })
export const FinishStep = DeclarationStartupDefaultsParent.command(
  'FinishStep',
  {
    messages: [ParentMessage.CompletedParentStep],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.CompletedParentStep())
    },
  },
)
export const AutomaticBinding = DeclarationStartupDefaultsParent.bindChild(
  ChildBlock,
  {
    field: 'automatic',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
  },
)
export const DefaultArgumentBinding =
  DeclarationStartupDefaultsParent.bindChild(DefaultChildBlock, {
    field: 'defaultArgument',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
  })
export const OptionalArgumentBinding =
  DeclarationStartupDefaultsParent.bindChild(OptionalChildBlock, {
    field: 'optionalArgument',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
  })
export const RequiredRestBinding = DeclarationStartupDefaultsParent.bindChild(
  RestChildBlock,
  {
    field: 'requiredRest',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: startup => [startup.count] },
  },
)
export const OptedOutBinding = DeclarationStartupDefaultsParent.bindChild(
  ChildBlock,
  {
    field: 'optedOut',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: false,
  },
)
export const OptionalBinding = DeclarationStartupDefaultsParent.bindChild(
  ChildBlock,
  {
    field: 'maybeChild',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: {
      args: startup =>
        startup.includeOptional ? Option.some([]) : Option.none(),
    },
  },
)
export const EntriesBinding = DeclarationStartupDefaultsParent.bindChild(
  ChildBlock,
  {
    field: 'entries',
    key: 'id',
    childField: 'child',
    toParentMessage: (_id, message) =>
      ParentMessage.GotChildMessage({ message }),
    fromParentMessage: false,
    init: {
      occurrences: startup =>
        startup.entryIds.map(id => ({ key: id, args: [] })),
      toItem: ({ key }, child) => ({ id: key, child }),
    },
  },
)
export const DeclarationStartupDefaultsParentComposition =
  DeclarationStartupDefaultsParent.toComposition({
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
const applyParentStep = DeclarationStartupDefaultsParent.step(model => ({
  model: Struct.modifyFields(model, { status: () => 'Stepped' }),
  commands: [FinishStep()],
}))
export const initialize = DeclarationStartupDefaultsParentComposition.init(
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
export const ParentBlock = DeclarationStartupDefaultsParentComposition.toBlock({
  init: initialize,
  update: DeclarationStartupDefaultsParentComposition.update(model => ({
    model,
  })),
  EffectsLayer: Layer.merge(FinishParentInitialization.layer, FinishStep.layer),
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- The early identity and its specialized contracts coexist in this fixture.
export const GenericOwner = Block.define('DeclarationStartupGenericParent')
export const DeclarationStartupGenericParent = GenericOwner.define({
  Model: Schema.Struct({ child: ChildModel }),
  Message: ParentMessage,
  Startup,
})
export const GenericBinding = DeclarationStartupGenericParent.bindChild(
  ChildBlock,
  {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: _startup => [] },
  },
)
export const WiderBinding = DeclarationStartupGenericParent.bindChild(
  ChildBlock,
  {
    field: 'child',
    placement: 'wider',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: (_startup: object) => [] },
  },
)
export const DeclarationStartupGenericParentComposition =
  DeclarationStartupGenericParent.toComposition({
    childBindings: [WiderBinding],
  })
export const initializeWithoutSelectorStartup =
  DeclarationStartupGenericParent.toComposition({
    childBindings: [
      DeclarationStartupGenericParent.bindChild(ChildBlock, {
        field: 'child',
        parentMessage: ParentMessage.GotChildMessage,
        init: { args: () => [] },
      }),
    ],
  }).init(() => ({ model: {} }))

export const ForeignStartup = Schema.Struct({ token: Schema.String })
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture compares two Startup contracts under the same Block identity.
export const ForeignGenericParent = GenericOwner.define({
  Model: DeclarationStartupGenericParent.Model,
  Message: ParentMessage,
  Startup: ForeignStartup,
})
export const ForeignGenericBinding = ForeignGenericParent.bindChild(
  ChildBlock,
  {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
    init: { args: _startup => [] },
  },
)

export const Application = defineApplication({
  Model: Schema.Struct({ child: ChildModel }),
  Message: ParentMessage,
  Startup,
})
export const ApplicationBinding = Application.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  init: { args: _startup => [] },
})

export const DeclarationStartupOrdinaryParent = Block.define(
  'DeclarationStartupOrdinaryParent',
  {
    Model: Schema.Struct({ child: ChildModel }),
    Message: ParentMessage,
  },
)
export const OrdinaryBinding = DeclarationStartupOrdinaryParent.bindChild(
  ChildBlock,
  {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
  },
)

const SharedStartupModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
})
const DeclarationCompatibleStartupParent = Block.define(
  'DeclarationCompatibleStartupParent',
  {
    Model: SharedStartupModel,
    Message: ParentMessage,
  },
)
const CountStartupBinding = DeclarationCompatibleStartupParent.bindChild(
  ChildBlock,
  {
    field: 'first',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: (_startup: Readonly<{ count: number }>) => [] },
  },
)
const LabelStartupBinding = DeclarationCompatibleStartupParent.bindChild(
  ChildBlock,
  {
    field: 'second',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: (_startup: Readonly<{ label: string }>) => [] },
  },
)
export const DeclarationCompatibleStartupParentComposition =
  DeclarationCompatibleStartupParent.toComposition({
    childBindings: [CountStartupBinding, LabelStartupBinding],
  })
export const initializeCompatibleStartup =
  DeclarationCompatibleStartupParentComposition.init(
    (startup: Readonly<{ count: number; label: string }>) => ({
      startup,
      model: {},
    }),
  )

const DeclarationMixedStartupParent = Block.define(
  'DeclarationMixedStartupParent',
  {
    Model: SharedStartupModel,
    Message: ParentMessage,
  },
)
const NoInputBinding = DeclarationMixedStartupParent.bindChild(ChildBlock, {
  field: 'first',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: () => [] },
})
const ContextInputBinding = DeclarationMixedStartupParent.bindChild(
  ChildBlock,
  {
    field: 'second',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: (_startup: Readonly<{ count: number }>) => [] },
  },
)
export const DeclarationMixedStartupParentComposition =
  DeclarationMixedStartupParent.toComposition({
    childBindings: [NoInputBinding, ContextInputBinding],
  })
export const initializeMixedStartup =
  DeclarationMixedStartupParentComposition.init(
    (startup: Readonly<{ count: number }>) => ({ startup, model: {} }),
  )
