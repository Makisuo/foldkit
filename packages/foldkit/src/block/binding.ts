import { Context, Layer, Option, Record } from 'effect'

import { type Command, mapMessages } from '../command/index.js'
import type {
  AnyBlockView,
  BoundBlockConfig,
  BoundBlockFields,
  BoundBlockView,
  ViewMountRequirementsOf,
} from '../html/block.js'
import * as ManagedResource from '../managedResource/index.js'
import type {
  AnyHandler as AnyMountHandler,
  LayeredMountDefinition,
  RequirementsOf as MountRequirementsOf,
} from '../mount/index.js'
import * as Subscription from '../subscription/subscription.js'
import * as Update from '../update/index.js'
import { registerBinding, runtimeBindingOf } from './composition.js'
import { type DefaultViewTypeId, defaultViewOf } from './defaultView.js'
import type { LocalMountsTypeId } from './definition.js'
import type { DirectConnection } from './directConnection.js'
import {
  type DefinitionIdentity,
  ViewScopeTypeId,
  copyIdentity,
  hostIdentitiesOf,
} from './identity.js'
import type { InstanceFrame } from './instanceContext.js'
import {
  assertRegisteredBinding,
  withOperationGraph,
} from './operationGraph.js'
import type { Owner } from './owner.js'
import type {
  HandlerEvidenceOfBlock,
  ValidateConcreteComposition,
} from './requirements.js'
import {
  type Qualify,
  type QualifyOwned,
  assertSegment,
  qualifyCommand,
  qualifyEffect,
  qualifyEntry,
  qualifyKey,
  qualifyLayer,
  qualifyStream,
} from './scope.js'

export type { LocalMountsTypeId } from './definition.js'

/**
 * @inline
 */
type AnyFunction = (...args: ReadonlyArray<any>) => any

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false

type ReturnOf<Value> = Value extends (
  ...args: ReadonlyArray<never>
) => infer Output
  ? Output
  : never

type AnyUpdateReturn = Readonly<{
  model: any
  commands?: ReadonlyArray<Command<any, never, any>> | undefined
  outMessage?: any
}>

type AnyProducer = (model: any, ...args: ReadonlyArray<any>) => AnyUpdateReturn

type ReservedBindingMember =
  | 'placement'
  | 'init'
  | 'fold'
  | 'subscriptions'
  | 'managedResources'
  | 'mounts'
  | 'EffectsLayer'
  | 'embedView'
  | '__blockBindingBlock'
  | '__blockHandlerRequirements'
  | '__blockKeyedBinding'

/** @internal Rejects owned Step names that would overwrite connection members. */
export type ValidateBindingStepNames<Steps> = [
  Extract<keyof Steps, ReservedBindingMember>,
] extends [never]
  ? unknown
  : Readonly<{
      'Block step names must not collide with connection members': Extract<
        keyof Steps,
        ReservedBindingMember
      >
    }>

const reservedBindingMembers = new Set<string>([
  'placement',
  'init',
  'fold',
  'subscriptions',
  'managedResources',
  'mounts',
  'EffectsLayer',
  'embedView',
  '__blockBindingBlock',
  '__blockHandlerRequirements',
  '__blockKeyedBinding',
])

/** @internal Guards JavaScript callers and erased Block values at runtime. */
export const assertValidBindingStepNames = (
  steps: Readonly<Record<string, unknown>>,
): void => {
  for (const name of Object.keys(steps)) {
    if (reservedBindingMembers.has(name)) {
      throw new Error(
        `[foldkit] Block Step name "${name}" collides with a connection member.`,
      )
    }
  }
}

/** Structural portion of a complete block needed to create a binding.
 * It deliberately omits the block's own `bind` method, avoiding a
 * recursive constraint while preserving every channel collected by parents. */
export type BindableBlock = Readonly<{
  owner: Owner<any>
  Model: Readonly<{ Type: any }>
  Message: Readonly<{ Type: any }>
  OutMessage?: Readonly<{ Type: any }>
  mounts: ReadonlyArray<LayeredMountDefinition>
  [LocalMountsTypeId]: ReadonlyArray<LayeredMountDefinition>
  children: ReadonlyArray<AnyBinding>
  init: AnyFunction
  update: AnyFunction
  steps: Readonly<Record<string, AnyFunction>>
  subscriptions: Subscription.Subscriptions<any, any, any>
  managedResources: Readonly<
    Record<
      string,
      ManagedResource.Entry<any, any, any, any, any, any, any, any>
    >
  >
  EffectsLayer: Layer.Any
  __blockHandlerRequirements?: unknown
  hostHandlers: ReadonlyArray<unknown>
}>

type DefinitionLocalMounts<BlockValue> =
  BlockValue extends Readonly<{ [LocalMountsTypeId]: infer Mounts }>
    ? Mounts
    : BlockValue extends Readonly<{ mounts: infer Mounts }>
      ? Mounts
      : readonly []

type DefinitionViewMountRequirements<BlockValue> =
  | MountRequirementsOf<DefinitionLocalMounts<BlockValue>>
  | (BlockValue extends Readonly<{
      children: infer Children extends ReadonlyArray<AnyBinding>
    }>
      ? RequirementsOfBindings<Children>
      : never)

/** @internal Checks an alternate embedded view against its declared child graph. */
export type ValidateEmbeddedViewMounts<
  BlockValue,
  View extends AnyBlockView,
> = [
  Exclude<
    ViewMountRequirementsOf<View>,
    DefinitionViewMountRequirements<BlockValue>
  >,
] extends [never]
  ? unknown
  : never

type BlockUpdate<BlockValue extends Readonly<{ update: AnyFunction }>> =
  BlockValue['update']

type BlockModel<BlockValue extends BindableBlock> = Parameters<
  BlockUpdate<BlockValue>
>[0]

type BlockMessage<
  BlockValue extends Readonly<{ Message: Readonly<{ Type: any }> }>,
> = BlockValue['Message']['Type']

/** The explicit parent policy for every OutMessage a bound child can emit.
 * `fold` handles the union locally. `forward` lifts at least one variant into
 * the parent's OutMessage union and may be paired with a local fold. */
export type OutMessagePolicy<
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
> =
  | Readonly<{
      fold: (
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (model: ParentModel) => Readonly<{ model: ParentModel }>
      forward?: never
    }>
  | Readonly<{
      forward: (outMessage: ChildOutMessage) => unknown | undefined
      fold?: (
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (model: ParentModel) => Readonly<{ model: ParentModel }>
    }>

type ValidateForwardPolicy<Policy> =
  Policy extends Readonly<{
    forward: infer Forward extends AnyFunction
  }>
    ? IsAny<ReturnType<Forward>> extends true
      ? never
      : IsUnknown<ReturnType<Forward>> extends true
        ? never
        : [ReturnType<Forward>] extends [void]
          ? never
          : [Exclude<ReturnType<Forward>, undefined>] extends [never]
            ? never
            : unknown
    : unknown

/** @internal Checks an inferred connection OutMessage policy. */
export type ValidateStaticPolicy<
  Policy,
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
> = [Policy] extends [
  OutMessagePolicy<ParentModel, ChildMessage, ParentMessage, ChildOutMessage>,
]
  ? ValidateForwardPolicy<Policy>
  : never

type SubscriptionWhen<BlockValue extends BindableBlock, ParentModel> =
  | ((model: ParentModel) => boolean)
  | Readonly<
      Partial<
        Record<
          keyof BlockValue['subscriptions'],
          (model: ParentModel) => boolean
        >
      >
    >

/** @internal Shared placement and lifecycle policy for connection forms. */
export type BindingBaseConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Placement extends string,
> = Readonly<{
  placement?: Placement
  read: (model: ParentModel) => Option.Option<BlockModel<BlockValue>>
  write: (
    model: ParentModel,
    nextChildModel: BlockModel<BlockValue>,
  ) => ParentModel
  toParentMessage: (message: BlockMessage<BlockValue>) => ParentMessage
  parentMessage?: never
  subscriptions?: Readonly<{
    when?: SubscriptionWhen<BlockValue, ParentModel>
  }>
}>

/** The one-time placement and parent policy used to bind a complete Block
 * block into a parent Model and Message context. Subscription gates are
 * lifecycle policy only; they never change whether the update fold can read
 * the child. */
export type BindingConfig<
  BlockValue extends Readonly<{
    Model: Readonly<{ Type: any }>
    Message: Readonly<{ Type: any }>
    subscriptions: Readonly<Record<string, unknown>>
  }>,
  ParentModel,
  ParentMessage,
  Placement extends string,
  Policy = never,
> = Readonly<{
  placement?: Placement
  read: (model: ParentModel) => Option.Option<BlockValue['Model']['Type']>
  write: (
    model: ParentModel,
    nextChildModel: BlockValue['Model']['Type'],
  ) => ParentModel
  toParentMessage: (message: BlockValue['Message']['Type']) => ParentMessage
  subscriptions?: Readonly<{
    when?:
      | ((model: ParentModel) => boolean)
      | Readonly<
          Partial<
            Record<
              keyof BlockValue['subscriptions'],
              (model: ParentModel) => boolean
            >
          >
        >
  }>
}> &
  (BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
    Message: Readonly<{ Type: infer ChildMessage }>
  }>
    ? Readonly<{ outMessage: Policy }> &
        ([Policy] extends [
          OutMessagePolicy<
            ParentModel,
            ChildMessage,
            ParentMessage,
            ChildOutMessage
          >,
        ]
          ? Policy extends Readonly<{
              forward: infer Forward extends (
                ...args: ReadonlyArray<any>
              ) => any
            }>
            ? 0 extends 1 & ReturnType<Forward>
              ? never
              : unknown extends ReturnType<Forward>
                ? never
                : [ReturnType<Forward>] extends [void]
                  ? never
                  : [Exclude<ReturnType<Forward>, undefined>] extends [never]
                    ? never
                    : unknown
            : unknown
          : never)
    : Readonly<{ outMessage?: never }>)

/** The parent update result after a child operation's Commands and OutMessage
 * policy have been lifted through its binding. Operations that cannot emit an
 * OutMessage keep the plain {@link Update.Return} contract. */
export type BindingReturn<
  ParentModel,
  ParentMessage,
  ChildProducer extends (...args: ReadonlyArray<any>) => any,
  Policy,
  Placement extends string = string,
  ChildId extends string = never,
  Registration = never,
> = Update.WithRegistrationEvidence<
  [
    ReturnType<ChildProducer> extends infer ChildReturn
      ? ChildReturn extends unknown
        ? 'outMessage' extends keyof ChildReturn
          ? ChildReturn extends Readonly<{ outMessage?: infer ChildOutMessage }>
            ? Exclude<ChildOutMessage, undefined>
            : never
          : never
        : never
      : never,
  ] extends [never]
    ? Update.Return<
        ParentModel,
        ParentMessage,
        Qualify<Placement, Update.RequirementsOf<ChildProducer>>
      >
    : (
          Policy extends Readonly<{
            fold?: (
              ...args: ReadonlyArray<any>
            ) => (...args: ReadonlyArray<any>) => infer PolicyReturn
          }>
            ? PolicyReturn
            : never
        ) extends infer PolicyReturn
      ?
          | (Policy extends Readonly<{
              forward: (
                ...args: ReadonlyArray<any>
              ) => infer ForwardedOutMessage
            }>
              ? Exclude<ForwardedOutMessage, undefined>
              : never)
          | (PolicyReturn extends unknown
              ? 'outMessage' extends keyof PolicyReturn
                ? PolicyReturn extends Readonly<{
                    outMessage?: infer DerivedOutMessage
                  }>
                  ? Exclude<DerivedOutMessage, undefined>
                  : never
                : never
              : never) extends infer ParentOutMessage
        ? (
            PolicyReturn extends unknown
              ? 'commands' extends keyof PolicyReturn
                ? PolicyReturn extends Readonly<{ commands?: infer Commands }>
                  ? NonNullable<Commands> extends ReadonlyArray<
                      infer PolicyCommand
                    >
                    ? PolicyCommand
                    : never
                  : never
                : never
              : never
          ) extends infer PolicyCommand
          ? [ParentOutMessage] extends [never]
            ? Update.Return<
                ParentModel,
                | ParentMessage
                | (PolicyCommand extends Command<infer CommandMessage, any, any>
                    ? CommandMessage
                    : never),
                | Qualify<Placement, Update.RequirementsOf<ChildProducer>>
                | QualifyOwned<
                    Placement,
                    ChildId,
                    Update.RequirementsOf<() => PolicyReturn>
                  >
              >
            : Update.ReturnWithOutMessage<
                ParentModel,
                | ParentMessage
                | (PolicyCommand extends Command<infer CommandMessage, any, any>
                    ? CommandMessage
                    : never),
                ParentOutMessage,
                | Qualify<Placement, Update.RequirementsOf<ChildProducer>>
                | QualifyOwned<
                    Placement,
                    ChildId,
                    Update.RequirementsOf<() => PolicyReturn>
                  >
              >
          : never
        : never
      : never,
  | Registration
  | Update.RegistrationEvidenceOf<
      Policy extends Readonly<{
        fold?: (
          ...args: ReadonlyArray<any>
        ) => (...args: ReadonlyArray<any>) => infer PolicyReturn
      }>
        ? PolicyReturn
        : never
    >
>

type Namespaced<Placement extends string, Entries> = {
  readonly [
    Key in keyof Entries as Key extends string ? `${Placement}/${Key}` : never
  ]: Entries[Key]
}

type BlockId<BlockValue> =
  BlockValue extends Readonly<{
    owner: Readonly<{ id: infer Id extends string }>
  }>
    ? Id
    : never

const liftSubscriptions = <
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
>(
  block: BlockValue,
  config: Readonly<{
    read: (model: ParentModel) => Option.Option<BlockModel<BlockValue>>
    toParentMessage: (message: BlockMessage<BlockValue>) => ParentMessage
    when?: SubscriptionWhen<BlockValue, ParentModel>
  }>,
) => Subscription.lift(block.subscriptions)<ParentModel, ParentMessage>(config)

const liftManagedResources = <
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
>(
  block: BlockValue,
  config: Readonly<{
    read: (model: ParentModel) => Option.Option<BlockModel<BlockValue>>
    toParentMessage: (message: BlockMessage<BlockValue>) => ParentMessage
  }>,
) =>
  ManagedResource.lift(block.managedResources)<ParentModel, ParentMessage>(
    config,
  )

type BoundSteps<
  BlockValue extends Readonly<{
    steps: Readonly<Record<string, (...args: ReadonlyArray<any>) => any>>
  }>,
  ParentModel,
  ParentMessage,
  Placement extends string,
  Policy,
> = Readonly<{
  [Key in keyof BlockValue['steps']]: BlockValue['steps'][Key] extends (
    ...args: ReadonlyArray<any>
  ) => any
    ? (
        ...args: Parameters<BlockValue['steps'][Key]> extends readonly [
          unknown,
          ...infer Context,
        ]
          ? Context
          : readonly []
      ) => (
        model: ParentModel,
      ) => BindingReturn<
        ParentModel,
        ParentMessage,
        BlockValue['steps'][Key],
        Policy,
        Placement,
        BlockId<BlockValue>,
        BindingRequirement<Placement, BlockValue>
      >
    : never
}>

/**
 * A complete static Block placement lowered into its parent context.
 */
export type Binding<
  BlockValue extends Readonly<{
    Model: Readonly<{ Type: any }>
    Message: Readonly<{ Type: any }>
    OutMessage?: Readonly<{ Type: any }>
    init: (...args: ReadonlyArray<any>) => any
    update: (...args: ReadonlyArray<any>) => any
    steps: Readonly<Record<string, (...args: ReadonlyArray<any>) => any>>
    subscriptions: Subscription.Subscriptions<any, any, any>
    managedResources: Readonly<
      Record<
        string,
        ManagedResource.Entry<any, any, any, any, any, any, any, any>
      >
    >
    mounts: ReadonlyArray<LayeredMountDefinition>
    EffectsLayer: Layer.Any
  }>,
  ParentModel,
  ParentMessage,
  Placement extends string,
  Policy,
> = Readonly<{
  /**
   * @internal Retains exact block evidence without a runtime field.
   */
  __blockBindingBlock: BlockValue
  /** @internal Retains qualified unresolved handler evidence for root assembly. */
  __blockHandlerRequirements: Qualify<
    Placement,
    HandlerEvidenceOfBlock<BlockValue>
  >
  placement: Placement
  /** Initializes child state while scoping and lifting its Commands. */
  init: (
    ...args: Parameters<BlockValue['init']>
  ) => Update.WithRegistrationEvidence<
    Update.Return<
      BlockValue['Model']['Type'],
      ParentMessage,
      Qualify<Placement, Update.RequirementsOf<BlockValue['init']>>
    >,
    BindingRequirement<Placement, BlockValue>
  >
  fold: (
    model: ParentModel,
    ...args: [
      message: BlockValue['Message']['Type'],
      ...context: Parameters<BlockValue['update']> extends readonly [
        unknown,
        unknown,
        ...infer Context,
      ]
        ? Context
        : readonly [],
    ]
  ) => BindingReturn<
    ParentModel,
    ParentMessage,
    BlockValue['update'],
    Policy,
    Placement,
    BlockId<BlockValue>,
    BindingRequirement<Placement, BlockValue>
  >
  subscriptions: {
    readonly [
      Key in keyof BlockValue['subscriptions']
    ]: BlockValue['subscriptions'][Key] extends Subscription.Subscription<
      any,
      any,
      infer Dependencies,
      infer Services
    >
      ? Subscription.Subscription<
          ParentModel,
          ParentMessage,
          Subscription.GatedDependencies<Dependencies>,
          Qualify<Placement, Services>
        > &
          (BlockValue['subscriptions'][Key] extends Readonly<{
            messages: infer Messages
          }>
            ? Readonly<{ messages: Messages }>
            : unknown) &
          (BlockValue['subscriptions'][Key] extends Readonly<{
            name: infer Name
            toLayer: infer ToLayer
          }>
            ? Readonly<{ name: Name; toLayer: ToLayer }>
            : unknown) &
          (BlockValue['subscriptions'][Key] extends Readonly<{
            layer: infer EntryLayer
          }>
            ? Readonly<{ layer: EntryLayer }>
            : unknown)
      : never
  }
  managedResources: {
    readonly [
      Key in keyof BlockValue['managedResources']
    ]: BlockValue['managedResources'][Key] extends ManagedResource.Entry<
      any,
      any,
      infer Requirements,
      infer Value,
      infer Service,
      infer OnAcquired extends (...args: ReadonlyArray<any>) => any,
      infer LifecycleServices,
      infer Params
    >
      ? ManagedResource.Entry<
          ParentModel,
          ParentMessage,
          Requirements,
          Value,
          Qualify<Placement, Service>,
          (...args: Parameters<OnAcquired>) => ParentMessage,
          Qualify<Placement, LifecycleServices>,
          Params
        > &
          (BlockValue['managedResources'][Key] extends Readonly<{
            name: infer Name
            toLayer: infer ToLayer
          }>
            ? Readonly<{ name: Name; toLayer: ToLayer }>
            : unknown) &
          (BlockValue['managedResources'][Key] extends Readonly<{
            layer: infer EntryLayer
          }>
            ? Readonly<{ layer: EntryLayer }>
            : unknown)
      : never
  }
  mounts: BlockValue['mounts']
  EffectsLayer: Layer.Layer<
    Qualify<Placement, Layer.Success<BlockValue['EffectsLayer']>>,
    Layer.Error<BlockValue['EffectsLayer']>,
    Qualify<Placement, Layer.Services<BlockValue['EffectsLayer']>>
  >
  embedView: BlockValue extends Readonly<{
    [DefaultViewTypeId]: infer CanonicalView extends AnyBlockView
  }>
    ? {
        <View extends AnyBlockView>(
          config: Omit<
            BoundBlockFields<View, ParentMessage>,
            'toParentMessage'
          > &
            ValidateEmbeddedViewMounts<BlockValue, View> &
            ([Parameters<View>[0], BlockValue['Model']['Type']] extends [
              BlockValue['Model']['Type'],
              Parameters<View>[0],
            ]
              ? [
                  Parameters<
                    BoundBlockFields<View, ParentMessage>['toParentMessage']
                  >[0],
                  BlockValue['Message']['Type'],
                ] extends [
                  BlockValue['Message']['Type'],
                  Parameters<
                    BoundBlockFields<View, ParentMessage>['toParentMessage']
                  >[0],
                ]
                ? unknown
                : never
              : never),
        ): BoundBlockConfig<
          BoundBlockView<View, BindingRequirement<Placement, BlockValue>>,
          ParentMessage
        >
        (
          config: Omit<
            BoundBlockFields<CanonicalView, ParentMessage>,
            'toParentMessage' | 'view'
          > &
            Readonly<{ view?: CanonicalView }>,
        ): BoundBlockConfig<
          BoundBlockView<
            CanonicalView,
            BindingRequirement<Placement, BlockValue>
          >,
          ParentMessage
        >
      }
    : <View extends AnyBlockView>(
        config: Omit<BoundBlockFields<View, ParentMessage>, 'toParentMessage'> &
          ValidateEmbeddedViewMounts<BlockValue, View> &
          ([Parameters<View>[0], BlockValue['Model']['Type']] extends [
            BlockValue['Model']['Type'],
            Parameters<View>[0],
          ]
            ? [
                Parameters<
                  BoundBlockFields<View, ParentMessage>['toParentMessage']
                >[0],
                BlockValue['Message']['Type'],
              ] extends [
                BlockValue['Message']['Type'],
                Parameters<
                  BoundBlockFields<View, ParentMessage>['toParentMessage']
                >[0],
              ]
              ? unknown
              : never
            : never),
      ) => BoundBlockConfig<
        BoundBlockView<View, BindingRequirement<Placement, BlockValue>>,
        ParentMessage
      >
}> &
  BoundSteps<BlockValue, ParentModel, ParentMessage, Placement, Policy>

/** The `Home.block.connection({...})` method of a complete Block. Parent
 * types are inferred from the placement accessors and Message lift. */
/** @internal Exactly one static parent Message adapter or wrapper constructor. */
export type MessageMapping<BlockValue extends BindableBlock, Mapper> =
  | Readonly<{
      toParentMessage: Mapper &
        NoInfer<(message: BlockValue['Message']['Type']) => unknown>
      parentMessage?: never
    }>
  | Readonly<{
      parentMessage: Mapper &
        NoInfer<
          (
            fields: Readonly<{ message: BlockValue['Message']['Type'] }>,
          ) => unknown
        >
      toParentMessage?: never
    }>

type AccessorBind<BlockValue extends BindableBlock> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
  }>
    ? <
        ParentModel,
        const ToParentMessage,
        const Policy,
        const Placement extends string = BlockValue extends Readonly<{
          owner: Readonly<{ id: infer Id extends string }>
        }>
          ? Id
          : never,
      >(
        config: Omit<
          BindingBaseConfig<BlockValue, ParentModel, never, Placement>,
          'toParentMessage' | 'parentMessage'
        > &
          MessageMapping<BlockValue, ToParentMessage> &
          Readonly<{
            outMessage: Policy
          }> &
          ValidateStaticPolicy<
            Policy,
            NoInfer<ParentModel>,
            NoInfer<BlockValue['Message']['Type']>,
            NoInfer<ReturnOf<ToParentMessage>>,
            NoInfer<ChildOutMessage>
          > &
          ValidateConcreteComposition<BlockValue>,
      ) => Binding<
        BlockValue,
        ParentModel,
        ReturnOf<ToParentMessage>,
        Placement,
        Policy
      >
    : <
        ParentModel,
        const ToParentMessage,
        const Placement extends string = BlockValue extends Readonly<{
          owner: Readonly<{ id: infer Id extends string }>
        }>
          ? Id
          : never,
      >(
        config: Omit<
          BindingBaseConfig<BlockValue, ParentModel, never, Placement>,
          'toParentMessage' | 'parentMessage'
        > &
          MessageMapping<BlockValue, ToParentMessage> &
          Readonly<{
            outMessage?: never
          }> &
          ValidateConcreteComposition<BlockValue>,
      ) => Binding<
        BlockValue,
        ParentModel,
        ReturnOf<ToParentMessage>,
        Placement,
        never
      >

/** Creates a static connection using explicit accessors or a required Struct field. */
export type Bind<BlockValue extends BindableBlock> = AccessorBind<BlockValue> &
  DirectConnection<BlockValue>

/** Structural bound for a child binding stored by a parent block.
 * @inline */
export type AnyBinding = Readonly<{
  /**
   * @internal Retains exact block evidence without a runtime field.
   */
  __blockBindingBlock: BindableBlock
  __blockHandlerRequirements?: unknown
  placement: string
  init: AnyFunction
  fold: AnyFunction
  subscriptions: BindableBlock['subscriptions']
  managedResources: BindableBlock['managedResources']
  mounts: ReadonlyArray<LayeredMountDefinition>
  EffectsLayer: Layer.Any
  embedView: AnyFunction
}>

/** @internal Evidence that an embedded view belongs to a registered binding. */
export type BindingRequirement<
  Placement extends string,
  BlockValue,
> = Readonly<{
  __blockBindingRequirement: Readonly<{
    placement: Placement
    block: BlockValue extends Readonly<{ mounts: infer Mounts }>
      ? Readonly<{
          owner: BlockValue extends Readonly<{ owner: infer OwnerValue }>
            ? OwnerValue
            : unknown
          mountRequirements: () => BlockValue extends Readonly<{
            owner: unknown
          }>
            ? MountRequirementsOf<Mounts>
            : AnyMountHandler
        }>
      : never
  }>
}>

/**
 * @internal Structural block evidence used by type-level fixtures.
 */
export type BindingBlockEvidence<BlockValue> = Readonly<{
  __blockBindingBlock: BlockValue
}>

/**
 * @internal Recovers the block type retained by a binding.
 */
export type BlockOfBinding<BindingValue> =
  BindingValue extends Readonly<{
    __blockBindingBlock: infer BlockValue
  }>
    ? BlockValue
    : never

/** @internal Recovers the registered graph requirement for one binding. */
export type RequirementOfBinding<BindingValue> =
  BindingValue extends Readonly<{
    placement: infer Placement extends string
    __blockBindingBlock: infer BlockValue
  }>
    ? BindingRequirement<Placement, BlockValue>
    : never

/** @internal Collects the registered graph requirements for child bindings. */
export type RequirementsOfBindings<Bindings extends ReadonlyArray<unknown>> =
  RequirementOfBinding<Bindings[number]>

const bindingBlocks = new WeakMap<AnyBinding, BindableBlock>()

/**
 * @internal Returns the block retained by a binding.
 */
export const blockOf = (binding: AnyBinding): BindableBlock => {
  const block = runtimeBindingOf(binding).block
  if (block === undefined) {
    throw new Error(
      "[foldkit] Block binding metadata is unavailable. Create bindings through a completed Block's connection method.",
    )
  }

  return block
}

type RuntimeOutMessagePolicy = Readonly<{
  fold?: AnyFunction
  forward?: AnyFunction
}>

type RuntimeBindingConfig = Readonly<{
  placement: string
  read: (model: any) => Option.Option<any>
  write: (model: any, nextChildModel: any) => any
  toParentMessage: (message: any) => any
  subscriptions?: Readonly<{ when?: any }>
  outMessage?: RuntimeOutMessagePolicy
}>

const toChildFold = (producer: AnyProducer, config: RuntimeBindingConfig) => ({
  update: (childModel: any, args: ReadonlyArray<any>) =>
    producer(childModel, ...args),
  read: config.read,
  write: config.write,
  toParentMessage: config.toParentMessage,
  ...(config.outMessage?.fold === undefined
    ? {}
    : { foldOutMessage: config.outMessage.fold }),
  ...(config.outMessage?.forward === undefined
    ? {}
    : { toParentOutMessage: config.outMessage.forward }),
})

const scopeReturn = (
  output: AnyUpdateReturn,
  placement: string,
  owner: Owner<any>,
  frame?: InstanceFrame,
  allowedIdentities: ReadonlyArray<DefinitionIdentity> = [],
): AnyUpdateReturn =>
  output.commands === undefined
    ? output
    : Update.withOutMessage(
        {
          model: output.model,
          commands: output.commands.map(command =>
            qualifyCommand(placement, command, owner, frame, allowedIdentities),
          ),
        },
        output.outMessage,
      )

const scopePolicy = (
  config: RuntimeBindingConfig,
  owner: Owner<any>,
  frame?: InstanceFrame,
  allowedIdentities: ReadonlyArray<DefinitionIdentity> = [],
): RuntimeBindingConfig => ({
  ...config,
  ...(config.outMessage?.fold === undefined
    ? {}
    : {
        outMessage: {
          ...config.outMessage,
          fold: (outMessage: unknown, context: Update.FoldContext<any, any>) =>
            config.outMessage!.fold!(outMessage, {
              ...context,
              liftCommand: (command: Command<any, any, any>) =>
                context.liftCommand(
                  qualifyCommand(
                    config.placement,
                    command,
                    owner,
                    frame,
                    allowedIdentities,
                  ),
                ),
              liftCommands: (commands: ReadonlyArray<Command<any, any, any>>) =>
                context.liftCommands(
                  commands.map(command =>
                    qualifyCommand(
                      config.placement,
                      command,
                      owner,
                      frame,
                      allowedIdentities,
                    ),
                  ),
                ),
            }),
        },
      }),
})

const makeFold = (
  producer: AnyProducer,
  config: RuntimeBindingConfig,
  frame: InstanceFrame,
): AnyFunction => {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const makeChildFold = Update.foldChild as unknown as (
    childFold: ReturnType<typeof toChildFold>,
  ) => AnyFunction
  return (model: any, ...args: ReadonlyArray<any>) => {
    assertRegisteredBinding(frame.binding, config.placement)

    const contextualConfig =
      config.outMessage?.fold === undefined
        ? config
        : {
            ...config,
            outMessage: {
              ...config.outMessage,
              fold: (
                outMessage: unknown,
                context: Update.FoldContext<any, any>,
              ) =>
                config.outMessage!.fold!(outMessage, {
                  ...context,
                  modelBeforeUpdate: model,
                }),
            },
          }
    return makeChildFold(toChildFold(producer, contextualConfig))(model, args)
  }
}

const makeBoundStep = (
  producer: AnyProducer,
  config: RuntimeBindingConfig,
  frame: InstanceFrame,
): AnyFunction => {
  const fold = makeFold(producer, config, frame)
  return (...args: ReadonlyArray<any>) =>
    (model: any) =>
      fold(model, ...args)
}

const makeBoundSteps = (
  steps: Readonly<Record<string, AnyProducer>>,
  config: RuntimeBindingConfig,
  frame: InstanceFrame,
): Readonly<Record<string, AnyFunction>> => {
  assertValidBindingStepNames(steps)
  const boundSteps: Record<string, AnyFunction> = {}

  for (const [name, step] of Object.entries(steps)) {
    boundSteps[name] = makeBoundStep(step, config, frame)
  }

  return boundSteps
}

const bindRuntime = <
  const BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  const Placement extends string,
  const Policy = never,
>(
  block: BlockValue,
  config: BindingConfig<
    BlockValue,
    ParentModel,
    ParentMessage,
    Placement,
    Policy
  >,
): Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy> => {
  const placement = config.placement ?? block.owner.id
  assertSegment(placement)
  const allowedIdentities = hostIdentitiesOf(block)
  const frame: InstanceFrame = {
    get binding() {
      return binding
    },
  }
  const runtimeConfig = scopePolicy(
    { ...config, placement },
    block.owner,
    frame,
    allowedIdentities,
  )
  const update = (model: any, ...args: ReadonlyArray<any>) =>
    scopeReturn(
      withOperationGraph(block.children, () => block.update(model, ...args)),
      placement,
      block.owner,
      frame,
      allowedIdentities,
    )
  const steps = Record.map(
    block.steps,
    step =>
      (model: any, ...args: ReadonlyArray<any>) =>
        scopeReturn(
          withOperationGraph(block.children, () => step(model, ...args)),
          placement,
          block.owner,
          frame,
          allowedIdentities,
        ),
  )
  const liftedSubscriptions = liftSubscriptions(block, {
    read: config.read,
    toParentMessage: config.toParentMessage,
    ...(config.subscriptions?.when === undefined
      ? {}
      : { when: config.subscriptions.when }),
  })
  const liftedManagedResources = liftManagedResources(block, {
    read: config.read,
    toParentMessage: config.toParentMessage,
  })
  const subscriptions = Record.map(liftedSubscriptions, (entry, key) => {
    copyIdentity(block.subscriptions[key]!, entry)
    const scoped = {
      ...qualifyEntry(placement, entry),
      dependenciesToStream: (dependencies: any, getSnapshot: any) =>
        qualifyStream(
          placement,
          entry.dependenciesToStream(dependencies, getSnapshot),
        ),
    }
    copyIdentity(entry, scoped)
    return scoped
  })
  const managedResources = Record.map(liftedManagedResources, (entry, key) => {
    copyIdentity(block.managedResources[key]!, entry)
    const scoped = {
      ...qualifyEntry(placement, entry),
      resource: {
        ...entry.resource,
        key: `${placement}/${entry.resource.key}`,
        _tag: Context.Service(qualifyKey(placement, entry.resource._tag.key)),
      },
      acquire: (params: any) => qualifyEffect(placement, entry.acquire(params)),
      release: (value: any) => qualifyEffect(placement, entry.release(value)),
    }
    copyIdentity(entry, scoped)
    return scoped
  })
  const embedView = <View extends AnyBlockView>(
    embedConfig: Omit<
      BoundBlockFields<View, ParentMessage>,
      'toParentMessage' | 'view'
    > &
      Readonly<{ view?: View }>,
  ): BoundBlockConfig<
    BoundBlockView<View, BindingRequirement<Placement, BlockValue>>,
    ParentMessage
  > =>
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ({
      ...embedConfig,
      view: embedConfig.view ?? defaultViewOf(block),
      [ViewScopeTypeId]: {
        placement,
        binding,
        identity: { owner: block.owner, children: block.children },
      },
      toParentMessage: config.toParentMessage,
    }) as unknown as BoundBlockConfig<
      BoundBlockView<View, BindingRequirement<Placement, BlockValue>>,
      ParentMessage
    >

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const boundSteps = makeBoundSteps(steps, runtimeConfig, frame)

  const binding = {
    placement,
    init: (...args: ReadonlyArray<any>) => {
      assertRegisteredBinding(binding, placement)

      const childInit = scopeReturn(
        withOperationGraph(block.children, () => block.init(...args)),
        placement,
        block.owner,
        { ...frame, isInitialization: true },
        allowedIdentities,
      )
      return {
        model: childInit.model,
        commands: mapMessages(childInit.commands, config.toParentMessage),
      }
    },
    fold: makeFold(update, runtimeConfig, frame),
    subscriptions,
    managedResources,
    mounts: block.mounts,
    EffectsLayer: qualifyLayer(
      placement,
      block.EffectsLayer as Layer.Layer<any, any, any>,
    ),
    embedView,
    ...boundSteps,
  } as unknown as Binding<
    BlockValue,
    ParentModel,
    ParentMessage,
    Placement,
    Policy
  >

  bindingBlocks.set(binding, block)
  registerBinding(binding, {
    block,
    select: model =>
      Option.match(config.read(model), {
        onNone: () => [],
        onSome: childModel => [{ model: childModel }],
      }),
    toParentMessage: (_key, message) => config.toParentMessage(message),
    subscriptionWhen: (model, _key, name) => {
      const when = config.subscriptions?.when
      if (typeof when === 'function') {
        return when(model)
      }
      return when?.[name]?.(model) ?? true
    },
  })

  return binding
}

type BindBlock = {
  <
    const BlockValue extends BindableBlock &
      Readonly<{ OutMessage: Readonly<{ Type: any }> }>,
    ParentModel,
    ParentMessage,
    const Placement extends string,
    const Policy extends OutMessagePolicy<
      ParentModel,
      BlockMessage<BlockValue>,
      ParentMessage,
      BlockValue['OutMessage']['Type']
    >,
  >(
    block: BlockValue,
    config: BindingBaseConfig<
      BlockValue,
      ParentModel,
      ParentMessage,
      Placement
    > &
      Readonly<{ outMessage: Policy }> &
      ValidateForwardPolicy<Policy>,
  ): Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>
  <
    const BlockValue extends BindableBlock & Readonly<{ OutMessage?: never }>,
    ParentModel,
    ParentMessage,
    const Placement extends string,
  >(
    block: BlockValue,
    config: BindingBaseConfig<
      BlockValue,
      ParentModel,
      ParentMessage,
      Placement
    > &
      Readonly<{ outMessage?: never }>,
  ): Binding<BlockValue, ParentModel, ParentMessage, Placement, never>
  (block: BindableBlock, config: never): AnyBinding
}

/** Binds a complete child block to one static or optional state
 * placement. Update, registered Steps, Subscriptions, and ManagedResources use
 * its placement accessors. Lifecycle and view Messages use its parent lift.
 * Parent init ordering remains explicit. */
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
export const bind: BindBlock = bindRuntime as unknown as BindBlock

type ChildRecordFunction<
  Child extends AnyBinding,
  Key extends 'subscriptions' | 'managedResources',
> = Child extends unknown
  ? (entries: Namespaced<Child['placement'], Child[Key]>) => void
  : never

type MergeRecords<
  Children extends ReadonlyArray<AnyBinding>,
  Key extends 'subscriptions' | 'managedResources',
> = [Children[number]] extends [never]
  ? {}
  : ChildRecordFunction<Children[number], Key> extends (
        entries: infer Entries,
      ) => void
    ? Entries
    : {}

type ChildMount<Children extends ReadonlyArray<AnyBinding>> =
  Children[number]['mounts'][number]

type LayerSuccess<Children extends ReadonlyArray<AnyBinding>> = Layer.Success<
  Children[number]['EffectsLayer']
>

type LayerError<Children extends ReadonlyArray<AnyBinding>> = Layer.Error<
  Children[number]['EffectsLayer']
>

type LayerServices<Children extends ReadonlyArray<AnyBinding>> = Layer.Services<
  Children[number]['EffectsLayer']
>

/** The lifecycle registrations and handler recipe contributed by a block's
 * bound children. */
export type AggregatedChildren<Children extends ReadonlyArray<AnyBinding>> =
  Readonly<{
    subscriptions: MergeRecords<Children, 'subscriptions'>
    managedResources: MergeRecords<Children, 'managedResources'>
    mounts: ReadonlyArray<ChildMount<Children>>
    EffectsLayer: Layer.Layer<
      LayerSuccess<Children>,
      LayerError<Children>,
      LayerServices<Children>
    >
  }>

const mergeChildRecords = (
  kind: 'Subscription' | 'ManagedResource',
  children: ReadonlyArray<AnyBinding>,
): Record<string, unknown> => {
  const entries: Record<string, unknown> = {}

  for (const child of children) {
    const childEntries =
      child[kind === 'Subscription' ? 'subscriptions' : 'managedResources']

    for (const [key, entry] of Object.entries(childEntries)) {
      const registrationKey = `${child.placement}/${key}`
      if (Object.hasOwn(entries, registrationKey)) {
        throw new Error(
          `Block.aggregateChildren: duplicate ${kind} registration key "${registrationKey}"`,
        )
      }

      entries[registrationKey] = entry
    }
  }

  return entries
}

/** Aggregates the complete static registrations of bound children. It qualifies
 * collected record keys by placement while each binding keeps readable local
 * keys for direct access. Repeated Mount blocks are shared, as is one
 * block's handler recipe across multiple placements. ManagedResources
 * receive placement-qualified service identities and independent value slots. */
export const aggregateChildren = <
  const Children extends ReadonlyArray<AnyBinding>,
>(
  children: Children,
): AggregatedChildren<Children> => {
  const subscriptions = mergeChildRecords('Subscription', children)
  const managedResources = mergeChildRecords('ManagedResource', children)
  const mounts: Array<LayeredMountDefinition> = []
  const seenMounts = new Set<LayeredMountDefinition>()
  const layers: Array<Layer.Any> = []
  const seenPlacements = new Set<string>()

  for (const child of children) {
    if (seenPlacements.has(child.placement)) {
      throw new Error(
        `[foldkit] Two child Blocks use placement "${child.placement}". Give repeated children distinct local placements.`,
      )
    }
    seenPlacements.add(child.placement)
    for (const mount of child.mounts) {
      if (!seenMounts.has(mount)) {
        seenMounts.add(mount)
        mounts.push(mount)
      }
    }

    layers.push(child.EffectsLayer)
  }

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const mergeLayers = Layer.merge as unknown as (
    merged: Layer.Any,
    layer: Layer.Any,
  ) => Layer.Any
  const EffectsLayer = layers.reduce(mergeLayers, Layer.empty)

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  return {
    subscriptions,
    managedResources,
    mounts,
    EffectsLayer,
  } as unknown as AggregatedChildren<Children>
}
