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
const Child = Block.define('DeclarationStartupDefaultChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
export const FinishChildInitialization = Child.command('FinishInitialization', {
  args: { count: Schema.Number },
  messages: [ChildMessage.CompletedInitialization],
  handler: function* () {
    yield* StartupClient
    return ({ count }) =>
      Effect.succeed(ChildMessage.CompletedInitialization({ count }))
  },
})
const FailChildConstruction = Child.command('FailConstruction', {
  messages: [ChildMessage.CompletedInitialization],
})
const FailChildConstructionLayer = FailChildConstruction.toLayer<
  never,
  'StartupUnavailable',
  never
>(Effect.fail<'StartupUnavailable'>('StartupUnavailable'))
const ChildComposition = Child.toComposition()
export const ChildBlock = ChildComposition.toBlock({
  init: ChildComposition.init(() => ({
    model: ChildModel.make({ count: 0 }),
    commands: [FinishChildInitialization({ count: 0 })],
  })),
  update: ChildComposition.update((model, { count }) => ({
    model: Struct.modifyFields(model, { count: () => count }),
  })),
  EffectsLayer: Layer.merge(
    FinishChildInitialization.layer,
    FailChildConstructionLayer,
  ),
})

const DefaultChild = Block.define('DeclarationStartupDefaultArgumentChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const DefaultChildComposition = DefaultChild.toComposition()
export const DefaultChildBlock = DefaultChildComposition.toBlock({
  init: DefaultChildComposition.init((count = 1) => ({
    model: ChildModel.make({ count }),
  })),
  update: DefaultChildComposition.update(model => ({ model })),
})

const OptionalChild = Block.define('DeclarationStartupOptionalArgumentChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const OptionalChildComposition = OptionalChild.toComposition()
export const OptionalChildBlock = OptionalChildComposition.toBlock({
  init: OptionalChildComposition.init((count?: number) => ({
    model: ChildModel.make({ count: count ?? 2 }),
  })),
  update: OptionalChildComposition.update(model => ({ model })),
})

const RestChild = Block.define('DeclarationStartupRequiredRestChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const RestChildComposition = RestChild.toComposition()
export const RestChildBlock = RestChildComposition.toBlock({
  init: RestChildComposition.init((first: number, ...rest: Array<number>) => ({
    model: ChildModel.make({ count: first + rest.length }),
  })),
  update: RestChildComposition.update(model => ({ model })),
})

const RequiredChild = Block.define('DeclarationStartupRequiredChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const RequiredChildComposition = RequiredChild.toComposition()
export const RequiredChildBlock = RequiredChildComposition.toBlock({
  init: RequiredChildComposition.init((count: number) => ({
    model: ChildModel.make({ count }),
  })),
  update: RequiredChildComposition.update(model => ({ model })),
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
  GotChildMessage: { message: ChildMessage },
  CompletedParentInitialization: {},
  CompletedParentStep: {},
})
export const Parent = Block.define('DeclarationStartupDefaultsParent', {
  Model: ParentModel,
  Message: ParentMessage,
  Startup,
})
export const FinishParentInitialization = Parent.command(
  'FinishInitialization',
  {
    messages: [ParentMessage.CompletedParentInitialization],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.CompletedParentInitialization())
    },
  },
)
export const FinishParentStep = Parent.command('FinishStep', {
  messages: [ParentMessage.CompletedParentStep],
  handler: function* () {
    return () => Effect.succeed(ParentMessage.CompletedParentStep())
  },
})
export const AutomaticBinding = Parent.bindChild(ChildBlock, {
  field: 'automatic',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
})
export const DefaultArgumentBinding = Parent.bindChild(DefaultChildBlock, {
  field: 'defaultArgument',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
})
export const OptionalArgumentBinding = Parent.bindChild(OptionalChildBlock, {
  field: 'optionalArgument',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
})
export const RequiredRestBinding = Parent.bindChild(RestChildBlock, {
  field: 'requiredRest',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: startup => [startup.count] },
})
export const OptedOutBinding = Parent.bindChild(ChildBlock, {
  field: 'optedOut',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: false,
})
export const OptionalBinding = Parent.bindChild(ChildBlock, {
  field: 'maybeChild',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: {
    args: startup =>
      startup.includeOptional ? Option.some([]) : Option.none(),
  },
})
export const EntriesBinding = Parent.bindChild(ChildBlock, {
  field: 'entries',
  key: 'id',
  childField: 'child',
  toParentMessage: (_id, message) => ParentMessage.GotChildMessage({ message }),
  fromParentMessage: false,
  init: {
    occurrences: startup => startup.entryIds.map(id => ({ key: id, args: [] })),
    toItem: ({ key }, child) => ({ id: key, child }),
  },
})
export const ParentComposition = Parent.toComposition({
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
const applyParentStep = Parent.step(model => ({
  model: Struct.modifyFields(model, { status: () => 'Stepped' }),
  commands: [FinishParentStep()],
}))
export const initialize = ParentComposition.init(
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
export const ParentBlock = ParentComposition.toBlock({
  init: initialize,
  update: ParentComposition.update(model => ({ model })),
  EffectsLayer: Layer.merge(
    FinishParentInitialization.layer,
    FinishParentStep.layer,
  ),
})

export const GenericOwner = Block.define('DeclarationStartupGenericParent')
export const GenericParent = GenericOwner.define({
  Model: Schema.Struct({ child: ChildModel }),
  Message: ParentMessage,
  Startup,
})
export const GenericBinding = GenericParent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  init: { args: _startup => [] },
})
export const WiderBinding = GenericParent.bindChild(ChildBlock, {
  field: 'child',
  placement: 'wider',
  parentMessage: ParentMessage.GotChildMessage,
  init: { args: (_startup: object) => [] },
})
export const WiderComposition = GenericParent.toComposition({
  childBindings: [WiderBinding],
})
export const initializeWithoutSelectorStartup = GenericParent.toComposition({
  childBindings: [
    GenericParent.bindChild(ChildBlock, {
      field: 'child',
      parentMessage: ParentMessage.GotChildMessage,
      init: { args: () => [] },
    }),
  ],
}).init(() => ({ model: {} }))

export const ForeignStartup = Schema.Struct({ token: Schema.String })
export const ForeignGenericParent = GenericOwner.define({
  Model: GenericParent.Model,
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

export const OrdinaryParent = Block.define('DeclarationStartupOrdinaryParent', {
  Model: Schema.Struct({ child: ChildModel }),
  Message: ParentMessage,
})
export const OrdinaryBinding = OrdinaryParent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

const SharedStartupModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
})
const CompatibleStartupParent = Block.define(
  'DeclarationCompatibleStartupParent',
  {
    Model: SharedStartupModel,
    Message: ParentMessage,
  },
)
const CountStartupBinding = CompatibleStartupParent.bindChild(ChildBlock, {
  field: 'first',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: (_startup: Readonly<{ count: number }>) => [] },
})
const LabelStartupBinding = CompatibleStartupParent.bindChild(ChildBlock, {
  field: 'second',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: (_startup: Readonly<{ label: string }>) => [] },
})
export const CompatibleStartupComposition =
  CompatibleStartupParent.toComposition({
    childBindings: [CountStartupBinding, LabelStartupBinding],
  })
export const initializeCompatibleStartup = CompatibleStartupComposition.init(
  (startup: Readonly<{ count: number; label: string }>) => ({
    startup,
    model: {},
  }),
)

const MixedStartupParent = Block.define('DeclarationMixedStartupParent', {
  Model: SharedStartupModel,
  Message: ParentMessage,
})
const NoInputBinding = MixedStartupParent.bindChild(ChildBlock, {
  field: 'first',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: () => [] },
})
const ContextInputBinding = MixedStartupParent.bindChild(ChildBlock, {
  field: 'second',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: (_startup: Readonly<{ count: number }>) => [] },
})
export const MixedStartupComposition = MixedStartupParent.toComposition({
  childBindings: [NoInputBinding, ContextInputBinding],
})
export const initializeMixedStartup = MixedStartupComposition.init(
  (startup: Readonly<{ count: number }>) => ({ startup, model: {} }),
)
