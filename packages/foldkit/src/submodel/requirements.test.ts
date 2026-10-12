import {
  Context,
  Effect,
  type Layer,
  Schema,
  type Scope,
  type Stream,
} from 'effect'
import { expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import * as ManagedResource from '../managedResource/index.js'
import { defineMessageUnion } from '../message/index.js'
import type * as Mount from '../mount/index.js'
import type * as Subscription from '../subscription/public.js'
import * as Update from '../update/index.js'
import type { BindingDefinitionEvidence } from './binding.js'
import { owner } from './owner.js'
import { type OwnedName, makeOwnedName } from './ownerName.js'
import type {
  HandlerOfHostDefinition,
  ManagedResourceLifecycleRequirements,
  ManagedResourceRuntimeServices,
  MountRequirements,
  OperationRequirementsOfDescriptor,
  ProducerRequirements,
  RequirementsOfDescriptor,
  SubscriptionRequirements,
  ValidateComposition,
} from './requirements.js'

const Message = defineMessageUnion({
  CompletedWork: { value: Schema.String },
  ReportedValue: { value: Schema.String },
})
type Message = typeof Message.Type
type CompletedWork = typeof Message.CompletedWork.Type

const Model = Schema.Struct({ value: Schema.String })
type Model = typeof Model.Type

const OutMessage = defineMessageUnion({
  ReportedValue: { value: Schema.String },
})
type OutMessage = typeof OutMessage.Type
type EmptyRecord = Readonly<Record<never, never>>

class RoomsClient extends Context.Service<
  RoomsClient,
  Readonly<{ roomName: string }>
>()('SubmodelRequirementsTestRoomsClient') {}

const Initialize = Command.define(makeOwnedName('Requirements', 'Initialize'), {
  messages: [Message.CompletedWork],
})

const WaitForBoot = Command.define(
  makeOwnedName('Requirements', 'WaitForBoot'),
  {
    messages: [Message.CompletedWork],
  },
)

const Refresh = Command.define(makeOwnedName('Requirements', 'Refresh'), {
  messages: [Message.CompletedWork],
})

const ReadHostState = Command.define(
  makeOwnedName('Requirements', 'ReadHostState'),
  { messages: [Message.CompletedWork] },
)

const LoadRoom = Command.define(makeOwnedName('Requirements', 'LoadRoom'), {
  messages: [Message.CompletedWork],
  handler: function* () {
    yield* RoomsClient
    return () => ReadHostState().effect
  },
})

const model = Model.make({ value: '' })

const reportedValue = (value: string): OutMessage =>
  OutMessage.ReportedValue({ value })

const init = () => ({ model, commands: [Initialize()] })

const update = Update.define((_model: Model, _message: Message) => ({
  model,
  commands: [LoadRoom()],
}))

const boot = Update.defineStep((_model: Model) => ({
  model,
  commands: [WaitForBoot()],
}))

const refresh = Update.defineStep((_model: Model) => ({
  model,
  commands: [Refresh()],
  outMessage: reportedValue('ready'),
}))

type CompleteDescriptor = Readonly<{
  init: typeof init
  update: typeof update
  steps: Readonly<{ boot: typeof boot; refresh: typeof refresh }>
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
  children: readonly []
  EffectsLayer: typeof LoadRoom.layer
  hostHandlers: readonly [
    typeof Initialize,
    typeof WaitForBoot,
    typeof Refresh,
    typeof ReadHostState,
  ]
}>

it('collects init, update, boot, public producer, and provider requirements', () => {
  expectTypeOf<ProducerRequirements<typeof init>>().toEqualTypeOf<
    Command.HandlerOf<typeof Initialize>
  >()
  expectTypeOf<ProducerRequirements<typeof refresh>>().toEqualTypeOf<
    Command.HandlerOf<typeof Refresh>
  >()
  type Requirements = RequirementsOfDescriptor<CompleteDescriptor>
  type Expected =
    | RoomsClient
    | Command.HandlerOf<typeof Initialize>
    | Command.HandlerOf<typeof WaitForBoot>
    | Command.HandlerOf<typeof Refresh>
    | Command.HandlerOf<typeof ReadHostState>

  expectTypeOf<Exclude<Requirements, Expected>>().toEqualTypeOf<never>()
  expectTypeOf<Exclude<Expected, Requirements>>().toEqualTypeOf<never>()

  type OperationRequirements =
    OperationRequirementsOfDescriptor<CompleteDescriptor>
  type ExpectedOperationRequirements =
    | Command.HandlerOf<typeof Initialize>
    | Command.HandlerOf<typeof LoadRoom>
    | Command.HandlerOf<typeof WaitForBoot>
    | Command.HandlerOf<typeof Refresh>

  expectTypeOf<
    Exclude<OperationRequirements, ExpectedOperationRequirements>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    Exclude<ExpectedOperationRequirements, OperationRequirements>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    ValidateComposition<CompleteDescriptor, CompleteDescriptor>
  >().toEqualTypeOf<unknown>()
})

it('preserves refined OutMessage producer requirements', () => {
  expectTypeOf<ReturnType<typeof refresh>['outMessage']>().toEqualTypeOf<
    OutMessage | undefined
  >()
  expectTypeOf<ProducerRequirements<typeof refresh>>().toEqualTypeOf<
    Command.HandlerOf<typeof Refresh>
  >()
})

type MissingHostDescriptor = Omit<CompleteDescriptor, 'hostHandlers'> &
  Readonly<{ hostHandlers: readonly [] }>

it('reports every handler without a local provider as a missing host contract', () => {
  type Missing = ValidateComposition<
    CompleteDescriptor,
    MissingHostDescriptor
  >['Submodel handler requirements must be provided locally or listed in hostHandlers']
  type Expected =
    | Command.HandlerOf<typeof Initialize>
    | Command.HandlerOf<typeof WaitForBoot>
    | Command.HandlerOf<typeof Refresh>
    | Command.HandlerOf<typeof ReadHostState>

  expectTypeOf<Exclude<Missing, Expected>>().toEqualTypeOf<never>()
  expectTypeOf<Exclude<Expected, Missing>>().toEqualTypeOf<never>()
})

type HostDefinition<Handler> = Readonly<{
  toLayer: (...args: ReadonlyArray<any>) => unknown
}> &
  (() => Readonly<{
    effect: Effect.Effect<CompletedWork, never, Handler>
  }>)

type ChildHandler = Command.Handler<
  OwnedName<'Requirements/Child', 'Work'>,
  void,
  CompletedWork
>
type ChildWork = HostDefinition<ChildHandler>

type ChildDescriptor = Readonly<{
  init: () => Update.Return<Model, Message, ChildHandler>
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
  children: readonly []
  EffectsLayer: Layer.Layer<never, never, never>
  hostHandlers: readonly [ChildWork]
}>

type ChildBinding = BindingDefinitionEvidence<ChildDescriptor> &
  Readonly<{
    fold: (model: Model) => Update.Return<Model, Message>
    steps: EmptyRecord
    subscriptions: EmptyRecord
    managedResources: EmptyRecord
    mounts: readonly []
  }>

type ParentBase = Readonly<{
  init: () => Update.Return<Model, Message>
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
  children: readonly [ChildBinding]
}>

type ParentSatisfiesChild = ParentBase &
  Readonly<{
    EffectsLayer: Layer.Layer<ChildHandler, never, never>
    hostHandlers: readonly []
  }>

type ParentForwardsChild = ParentBase &
  Readonly<{
    EffectsLayer: Layer.Layer<never, never, never>
    hostHandlers: readonly [ChildWork]
  }>

it('lets a parent satisfy or forward a child host contract', () => {
  expectTypeOf<
    RequirementsOfDescriptor<ParentSatisfiesChild>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    ValidateComposition<ParentSatisfiesChild, ParentSatisfiesChild>
  >().toEqualTypeOf<unknown>()

  expectTypeOf<
    RequirementsOfDescriptor<ParentForwardsChild>
  >().toEqualTypeOf<ChildHandler>()
  expectTypeOf<
    ValidateComposition<ParentForwardsChild, ParentForwardsChild>
  >().toEqualTypeOf<unknown>()
})

type SubscriptionHandler = Subscription.Handler<
  OwnedName<'Requirements', 'RoomChanges'>,
  Readonly<{ roomId: string }>,
  Message
>

type RoomChanges = Readonly<{
  toLayer: (...args: ReadonlyArray<any>) => unknown
  dependenciesToStream: (
    dependencies: Readonly<{ roomId: string }>,
  ) => Stream.Stream<Message, never, SubscriptionHandler>
}>

type MountHandler = Mount.Handler<
  OwnedName<'Requirements', 'FocusRoom'>,
  Readonly<{ element: Element }>,
  Message
>

type FocusRoom = Readonly<{
  toLayer: (...args: ReadonlyArray<any>) => unknown
}> &
  (() => Mount.MountAction<Message, never, MountHandler>)

const RoomConnection = ManagedResource.tag<string>()(
  'Requirements/RoomConnection',
)
type RoomConnectionService = ManagedResource.ServiceOf<typeof RoomConnection>
type ResourceHandler = ManagedResource.Handler<
  OwnedName<'Requirements', 'ManageRoomConnection'>,
  Readonly<{ roomId: string }>,
  string
>

type ManageRoomConnection = Readonly<{
  toLayer: (...args: ReadonlyArray<any>) => unknown
  resource: typeof RoomConnection
  acquire: (
    params: Readonly<{ roomId: string }>,
  ) => Effect.Effect<string, unknown, Scope.Scope | ResourceHandler>
  release: (
    value: string,
  ) => Effect.Effect<void, unknown, Scope.Scope | ResourceHandler>
}>

type Registrations = Readonly<{
  subscriptions: Readonly<{ roomChanges: RoomChanges }>
  managedResources: Readonly<{ roomConnection: ManageRoomConnection }>
  mounts: readonly [FocusRoom]
}>

it('extracts exact lifecycle registrations and runtime services', () => {
  expectTypeOf<
    SubscriptionRequirements<Registrations['subscriptions']>
  >().toEqualTypeOf<SubscriptionHandler>()
  expectTypeOf<
    ManagedResourceLifecycleRequirements<Registrations['managedResources']>
  >().toEqualTypeOf<ResourceHandler>()
  expectTypeOf<
    ManagedResourceRuntimeServices<Registrations['managedResources']>
  >().toEqualTypeOf<RoomConnectionService>()
  expectTypeOf<
    MountRequirements<Registrations['mounts']>
  >().toEqualTypeOf<MountHandler>()
  expectTypeOf<
    HandlerOfHostDefinition<RoomChanges>
  >().toEqualTypeOf<SubscriptionHandler>()
  expectTypeOf<
    HandlerOfHostDefinition<ManageRoomConnection>
  >().toEqualTypeOf<ResourceHandler>()
  expectTypeOf<
    HandlerOfHostDefinition<FocusRoom>
  >().toEqualTypeOf<MountHandler>()
})

type ResourceOperation = () => Update.Return<
  Model,
  Message,
  RoomConnectionService
>

type RuntimeHandleDescriptor = Readonly<{
  init: ResourceOperation
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: Registrations['managedResources']
  mounts: readonly []
  children: readonly []
  EffectsLayer: Layer.Layer<never, never, RoomConnectionService>
  hostHandlers: readonly [ManageRoomConnection]
}>

it('satisfies operation handles at runtime but preserves Layer construction inputs', () => {
  type Requirements = RequirementsOfDescriptor<RuntimeHandleDescriptor>
  type Expected = RoomConnectionService | ResourceHandler

  expectTypeOf<Exclude<Requirements, Expected>>().toEqualTypeOf<never>()
  expectTypeOf<Exclude<Expected, Requirements>>().toEqualTypeOf<never>()
})

type RuntimeHandleBinding = BindingDefinitionEvidence<RuntimeHandleDescriptor> &
  Readonly<{
    fold: (model: Model) => Update.Return<Model, Message>
    steps: EmptyRecord
    subscriptions: EmptyRecord
    managedResources: Registrations['managedResources']
    mounts: readonly []
  }>

type ParentWithLiftedRuntimeHandle = Readonly<{
  init: () => Update.Return<Model, Message>
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: Registrations['managedResources']
  mounts: readonly []
  children: readonly [RuntimeHandleBinding]
  EffectsLayer: Layer.Layer<never, never, never>
  hostHandlers: readonly [ManageRoomConnection]
}>

it('does not erase an inherited child Layer construction handle', () => {
  type Requirements = RequirementsOfDescriptor<ParentWithLiftedRuntimeHandle>
  type Expected = RoomConnectionService | ResourceHandler

  expectTypeOf<Exclude<Requirements, Expected>>().toEqualTypeOf<never>()
  expectTypeOf<Exclude<Expected, Requirements>>().toEqualTypeOf<never>()
})

type NearbyOrdinaryServiceDescriptor = Readonly<{
  init: () => Update.Return<Model, Message, RoomsClient>
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
  children: readonly []
  EffectsLayer: Layer.Layer<RoomsClient, never, never>
  hostHandlers: readonly []
}>

it('separates unchanged operation services from Layer assembly residuals', () => {
  expectTypeOf<
    RequirementsOfDescriptor<NearbyOrdinaryServiceDescriptor>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    OperationRequirementsOfDescriptor<NearbyOrdinaryServiceDescriptor>
  >().toEqualTypeOf<RoomsClient>()
})

const protocolOwner = owner('Requirements')

const Save = Command.define(protocolOwner.name('Save'), {
  args: { value: Schema.String },
  messages: [Message.CompletedWork],
})

const RawSave = Command.define('Requirements/Save', {
  args: { id: Schema.Number },
  messages: [Message.CompletedWork],
})

const saveInit = () => ({
  model,
  commands: [Save({ value: 'saved' })],
})

type IncompatibleDescriptor = Omit<
  NearbyOrdinaryServiceDescriptor,
  'init' | 'EffectsLayer' | 'hostHandlers'
> &
  Readonly<{
    init: typeof saveInit
    EffectsLayer: Layer.Layer<Command.HandlerOf<typeof RawSave>, never, never>
    hostHandlers: readonly [typeof Save]
  }>

it('rejects an owned and raw definition with the same qualified name but incompatible protocols', () => {
  expectTypeOf<
    ValidateComposition<
      IncompatibleDescriptor,
      IncompatibleDescriptor
    >['Conflicting Foldkit handler contracts']
  >().toEqualTypeOf<'Command/Requirements/Save'>()
})

type ErasedProducerDescriptor = Omit<CompleteDescriptor, 'steps'> &
  Readonly<{
    steps: Readonly<{
      erased: () => Update.Return<Model, Message, any>
    }>
  }>

it('rejects erased producer requirements', () => {
  expectTypeOf<
    ValidateComposition<
      CompleteDescriptor,
      ErasedProducerDescriptor
    >['Submodel requirement sources must preserve exact service types']
  >().toEqualTypeOf<'init, update, or steps'>()
})

const ImportedWork = Command.define('ImportedWork', {
  messages: [Message.CompletedWork],
})

const ImportedWorkLayer = ImportedWork.toLayer(
  Effect.succeed(() =>
    Effect.succeed(Message.CompletedWork({ value: 'imported' })),
  ),
)

const importedInit = () => ({ model, commands: [ImportedWork()] })

type ImportedBase = Readonly<{
  init: typeof importedInit
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  steps: EmptyRecord
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
  children: readonly []
}>

type LocallyProvidedImportedCommand = ImportedBase &
  Readonly<{
    EffectsLayer: typeof ImportedWorkLayer
    hostHandlers: readonly []
  }>

type HostProvidedImportedCommand = ImportedBase &
  Readonly<{
    EffectsLayer: Layer.Layer<never, never, never>
    hostHandlers: readonly [typeof ImportedWork]
  }>

it('accepts an exact unbranded imported Command from a local provider', () => {
  expectTypeOf<
    OperationRequirementsOfDescriptor<LocallyProvidedImportedCommand>
  >().toEqualTypeOf<Command.HandlerOf<typeof ImportedWork>>()
  expectTypeOf<
    RequirementsOfDescriptor<LocallyProvidedImportedCommand>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    ValidateComposition<
      LocallyProvidedImportedCommand,
      LocallyProvidedImportedCommand
    >
  >().toEqualTypeOf<unknown>()
})

it('accepts an exact unbranded imported Command as a host contract', () => {
  expectTypeOf<
    RequirementsOfDescriptor<HostProvidedImportedCommand>
  >().toEqualTypeOf<Command.HandlerOf<typeof ImportedWork>>()
  expectTypeOf<
    ValidateComposition<
      HostProvidedImportedCommand,
      HostProvidedImportedCommand
    >
  >().toEqualTypeOf<unknown>()
})

const refreshFactory = (value: string) =>
  Update.defineStep((stepModel: Model) => ({
    model: stepModel,
    commands: [Refresh()],
    outMessage: reportedValue(value),
  }))

it('retains Command requirements through nested Step factories', () => {
  expectTypeOf<ProducerRequirements<typeof refreshFactory>>().toEqualTypeOf<
    Command.HandlerOf<typeof Refresh>
  >()

  type DeferredAgain = () => typeof refreshFactory
  expectTypeOf<ProducerRequirements<DeferredAgain>>().toEqualTypeOf<
    Command.HandlerOf<typeof Refresh>
  >()
})

type StepFactoryBinding = Readonly<{
  fold: (model: Model, message: Message) => Update.Return<Model, Message>
  step: typeof refreshFactory
  steps: Readonly<{ refresh: typeof refreshFactory }>
  subscriptions: EmptyRecord
  managedResources: EmptyRecord
  mounts: readonly []
}>

type ParentWithPolicyStep = Readonly<{
  init: () => Update.Return<Model, Message>
  update: (model: Model, message: Message) => Update.Return<Model, Message>
  children: readonly [StepFactoryBinding]
  EffectsLayer: Layer.Layer<never, never, never>
  hostHandlers: readonly []
}>

it('reports policy Commands returned by argument-taking bound Steps', () => {
  expectTypeOf<RequirementsOfDescriptor<ParentWithPolicyStep>>().toEqualTypeOf<
    Command.HandlerOf<typeof Refresh>
  >()

  expectTypeOf<
    ValidateComposition<
      ParentWithPolicyStep,
      ParentWithPolicyStep
    >['Submodel handler requirements must be provided locally or listed in hostHandlers']
  >().toEqualTypeOf<Command.HandlerOf<typeof Refresh>>()
})
