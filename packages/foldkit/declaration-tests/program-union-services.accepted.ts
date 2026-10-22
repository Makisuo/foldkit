import { Context, Effect, Layer, Option, Schema } from 'effect'
import { Block, Message, Program } from 'foldkit'

export const ResourceMessage = Message.defineMessageUnion({
  CompletedRead: {},
})
export const Definition = Block.makeDefinition('UnionServiceProof', {
  Model: Schema.Null,
  Message: ResourceMessage,
})
export const Session = Definition.makeResource<string>()('Session')
export const ReadSession = Definition.makeCommand('ReadSession', {
  messages: [ResourceMessage.CompletedRead],
  handler: function* () {
    return () =>
      Session.get.pipe(
        Effect.map(() => ResourceMessage.CompletedRead()),
        Effect.catch(() => Effect.succeed(ResourceMessage.CompletedRead())),
      )
  },
})
export const managedResources = Definition.makeManagedResources(entry => ({
  session: entry('ManageSession', Schema.Option(Schema.Null), {
    resource: Session,
    modelToMaybeRequirements: () => Option.some(null),
    onAcquired: () => ResourceMessage.CompletedRead(),
    onReleased: () => ResourceMessage.CompletedRead(),
    onAcquireError: () => ResourceMessage.CompletedRead(),
    handler: function* () {
      return {
        acquire: () => Effect.succeed('ready'),
        release: () => Effect.void,
      }
    },
  }),
}))
export const Composition = Definition.makeComposition()
export const implementation = {
  init: Composition.makeInit(() => ({
    model: null,
    commands: [ReadSession()],
  })),
  update: Composition.makeUpdate(model => ({ model })),
  view: Composition.makeView(() => null),
  EffectsLayer: ReadSession.layer,
}
export const RegisteredBlock = Composition.assembleBlock({
  ...implementation,
  managedResources,
  EffectsLayer: Layer.merge(ReadSession.layer, managedResources.session.layer),
})
export const UnregisteredBlock = Composition.assembleBlock(implementation)
export const RenamedRegistrationBlock = Composition.assembleBlock({
  ...implementation,
  managedResources: { alternateSession: managedResources.session },
  EffectsLayer: Layer.merge(ReadSession.layer, managedResources.session.layer),
})
export const SessionReaderLayer = Layer.effectDiscard(
  Session.get.pipe(Effect.catch(() => Effect.succeed('idle'))),
)
export type SessionService = Layer.Services<typeof SessionReaderLayer>

export class Store extends Context.Service<
  Store,
  Readonly<{ label: string }>
>()('UnionServiceProof/Store') {}
export const StoreLayer = Layer.succeed(Store, { label: 'ready' })

export const startRegistered = Program.makeElement({
  block: RegisteredBlock,
  container: null,
}).provide(SessionReaderLayer).start

export const startEveryAlternativeRegistered = (
  block: typeof RegisteredBlock | typeof RenamedRegistrationBlock,
) =>
  Program.makeElement({ block, container: null })
    .provide(Layer.empty)
    .provide(SessionReaderLayer).start

export const startUnionWithProvider = (
  block: typeof RegisteredBlock | typeof UnregisteredBlock,
  layer: Layer.Layer<SessionService>,
) =>
  Program.makeElement({ block, container: null })
    .provide(Layer.empty)
    .provide(layer).start

export const startEveryAlternativeWithOrdinaryProvider = (
  block: typeof RegisteredBlock | typeof RenamedRegistrationBlock,
) =>
  Program.makeElement({ block, container: null })
    .provide(Layer.effectDiscard(Store))
    .provide(StoreLayer).start

export const KeyedModel = Schema.Struct({
  sessions: Schema.Array(
    Schema.Struct({ id: Schema.String, model: Schema.Null }),
  ),
})
export const KeyedDefinition = Block.makeDefinition('UnionKeyedServiceProof', {
  Model: KeyedModel,
  Message: ResourceMessage,
})
export const RegisteredBinding = KeyedDefinition.makeBinding(RegisteredBlock, {
  field: 'sessions',
  key: 'id',
  childField: 'model',
})
export const UnregisteredBinding = KeyedDefinition.makeBinding(
  UnregisteredBlock,
  {
    field: 'sessions',
    key: 'id',
    childField: 'model',
  },
)
export const OtherPlacementBinding = KeyedDefinition.makeBinding(
  RegisteredBlock,
  {
    field: 'sessions',
    key: 'id',
    childField: 'model',
    placement: 'otherSessions',
  },
)
export const RenamedRegisteredBinding = KeyedDefinition.makeBinding(
  RenamedRegistrationBlock,
  {
    field: 'sessions',
    key: 'id',
    childField: 'model',
  },
)
export const RegisteredComposition = KeyedDefinition.makeComposition({
  bindings: [RegisteredBinding],
})
export const UnregisteredComposition = KeyedDefinition.makeComposition({
  bindings: [UnregisteredBinding],
})
export const OtherPlacementComposition = KeyedDefinition.makeComposition({
  bindings: [OtherPlacementBinding],
})
export const RenamedRegisteredComposition = KeyedDefinition.makeComposition({
  bindings: [RenamedRegisteredBinding],
})
export const KeyedRegisteredBlock = RegisteredComposition.assembleBlock({
  init: () => ({ model: KeyedModel.make({ sessions: [] }) }),
  update: RegisteredComposition.makeUpdate(model => ({ model })),
  view: RegisteredComposition.makeView(() => null),
})
export const KeyedUnregisteredBlock = UnregisteredComposition.assembleBlock({
  init: () => ({ model: KeyedModel.make({ sessions: [] }) }),
  update: UnregisteredComposition.makeUpdate(model => ({ model })),
  view: UnregisteredComposition.makeView(() => null),
})
export const KeyedOtherPlacementBlock = OtherPlacementComposition.assembleBlock(
  {
    init: () => ({ model: KeyedModel.make({ sessions: [] }) }),
    update: OtherPlacementComposition.makeUpdate(model => ({ model })),
    view: OtherPlacementComposition.makeView(() => null),
  },
)
export const KeyedRenamedRegisteredBlock =
  RenamedRegisteredComposition.assembleBlock({
    init: () => ({ model: KeyedModel.make({ sessions: [] }) }),
    update: RenamedRegisteredComposition.makeUpdate(model => ({ model })),
    view: RenamedRegisteredComposition.makeView(() => null),
  })
export type KeyedSessionService = Block.Qualify<
  typeof RegisteredBinding.placement,
  SessionService
>
export const startKeyedWithProvider = (
  block: typeof KeyedRegisteredBlock | typeof KeyedUnregisteredBlock,
  layer: Layer.Layer<KeyedSessionService>,
) => Program.makeElement({ block, container: null }).provide(layer).start

export const startEveryKeyedAlternativeRegistered = (
  block: typeof KeyedRegisteredBlock | typeof KeyedRenamedRegisteredBlock,
  layer: Layer.Layer<never, never, KeyedSessionService>,
) => Program.makeElement({ block, container: null }).provide(layer).start

export const ReadStore = Definition.makeCommand('ReadStore', {
  messages: [ResourceMessage.CompletedRead],
  handler: function* () {
    return () => Effect.map(Store, () => ResourceMessage.CompletedRead())
  },
})
export const storeImplementation = {
  init: Composition.makeInit(() => ({ model: null, commands: [ReadStore()] })),
  update: Composition.makeUpdate(model => ({ model })),
  view: Composition.makeView(() => null),
}
export const SuppliedStoreBlock = Composition.assembleBlock({
  ...storeImplementation,
  EffectsLayer: Layer.merge(ReadStore.layer, StoreLayer),
})
export const UnsuppliedStoreBlock = Composition.assembleBlock({
  ...storeImplementation,
  EffectsLayer: ReadStore.layer,
})
export const startStoreUnionWithProvider = (
  block: typeof SuppliedStoreBlock | typeof UnsuppliedStoreBlock,
) => Program.makeElement({ block, container: null }).provide(StoreLayer).start

export const makeResourceUnionProgram = (
  block: typeof RegisteredBlock | typeof UnregisteredBlock,
) => Program.makeElement({ block, container: null })

export const makeRegisteredUnionProgram = (
  block: typeof RegisteredBlock | typeof RenamedRegistrationBlock,
) => Program.makeElement({ block, container: null })

export const makeKeyedResourceUnionProgram = (
  block: typeof KeyedRegisteredBlock | typeof KeyedUnregisteredBlock,
) => Program.makeElement({ block, container: null })

export const makeDifferentPlacementProgram = (
  block: typeof KeyedRegisteredBlock | typeof KeyedOtherPlacementBlock,
  layer: Layer.Layer<never, never, KeyedSessionService>,
) => Program.makeElement({ block, container: null }).provide(layer)

export const makeStoreUnionProgram = (
  block: typeof SuppliedStoreBlock | typeof UnsuppliedStoreBlock,
) => Program.makeElement({ block, container: null })

const assembleRegisteredBlock = () => RegisteredBlock
const assembleUnregisteredBlock = () => UnregisteredBlock
export const AnnotatedRegisteredBlock: Block.FromAssemblyWithView<
  typeof Schema.Null,
  typeof assembleRegisteredBlock
> = assembleRegisteredBlock()
export const AnnotatedUnregisteredBlock: Block.FromAssemblyWithView<
  typeof Schema.Null,
  typeof assembleUnregisteredBlock
> = assembleUnregisteredBlock()
