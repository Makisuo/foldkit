import {
  Array,
  type Effect,
  type Equivalence,
  Layer,
  type Option,
  Predicate,
  type Schema,
  type Scope,
  type Stream,
} from 'effect'

import type { Command } from '../command/index.js'
import {
  type AnyAuthoredView,
  type AnyBlockView,
  type BlockView,
  type Document,
  type DocumentView,
  type HtmlBuilder,
  defineView as defineHtmlView,
} from '../html/index.js'
import * as ManagedResource from '../managedResource/index.js'
import * as Mount from '../mount/index.js'
import * as Subscription from '../subscription/subscription.js'
import type * as Update from '../update/index.js'
import type { VNode } from '../vdom.js'
import {
  type AggregatedChildren,
  type AnyBinding,
  type Bind,
  type RequirementsOfBindings,
  aggregateChildren,
  assertValidBindingStepNames,
  bind as bindBlock,
} from './binding.js'
import { descendantOwnersOf } from './composition.js'
import { type DefaultViewTypeId, registerDefaultView } from './defaultView.js'
import { normalizeConnectionConfig } from './directConnection.js'
import {
  type DefinitionIdentity,
  identityOf,
  registerBlockHostIdentities,
  registerDefinition,
} from './identity.js'
import { type BindEach, bindEach as bindEachBlock } from './keyedBinding.js'
import type { Owner } from './owner.js'
import { makeOwnedName } from './ownerName.js'
import type {
  HandlerEvidence,
  HandlerOfHostDefinition,
  HandlerRequirements,
  ValidateComposition,
  ValidateImplementationComposition,
} from './requirements.js'
import type { ValidateConstructionRequirements } from './scope.js'
import { selectLayer } from './scope.js'
import { withViewIdentity } from './viewScope.js'

type AnySchema = Schema.Codec<any, any, any, any>
type AnyFunction = (...args: ReadonlyArray<any>) => any

type ReturnOf<Function extends AnyFunction> = Function extends (
  ...args: ReadonlyArray<never>
) => infer Output
  ? Output
  : never
type AnyLayer = Layer.Layer<never, any, any> | Layer.Layer<any, any, any>
type EmptyRecord = Readonly<Record<never, never>>
type AnySubscriptions = Subscription.Subscriptions<any, any, any>
type AnyManagedResources = Readonly<
  Record<string, ManagedResource.Entry<any, any, any, any, any, any, any, any>>
>

type ValidateHandlerConstruction<
  Yielded extends Effect.Effect<unknown, unknown, unknown>,
> = ValidateConstructionRequirements<Effect.Services<Yielded>>

/** @internal Identifies the local Layer recipe before child aggregation. */
export const LocalEffectsLayerTypeId = Symbol('foldkit/Block/LocalEffectsLayer')

/** @internal Identifies the Mount definitions owned directly by a block. */
export const LocalMountsTypeId = Symbol('foldkit/Block/LocalMounts')

type LocalChannels = Readonly<{
  subscriptions: Subscription.Subscriptions<any, any, any>
  managedResources: Readonly<
    Record<string, ManagedResource.ManagedResourceConfig<any, any>>
  >
}>

const localChannels = new WeakMap<object, LocalChannels>()

/** @internal Returns only the lifecycle channels implemented by this block. */
export const localChannelsOf = (block: object): LocalChannels => {
  const channels = localChannels.get(block)
  if (channels === undefined) {
    throw new Error('[foldkit] Block local channels are unavailable.')
  }
  return channels
}

type CommandRequirements<Output> = Output extends unknown
  ? 'commands' extends keyof Output
    ? Output extends Readonly<{ commands?: infer Commands }>
      ? NonNullable<Commands> extends ReadonlyArray<infer Command>
        ? Command extends Readonly<{
            effect: import('effect').Effect.Effect<any, any, infer Requirements>
          }>
          ? Requirements
          : never
        : never
      : never
    : never
  : never

type OutMessageOfReturn<Output> = Output extends unknown
  ? 'outMessage' extends keyof Output
    ? Output extends Readonly<{ outMessage?: infer OutMessage }>
      ? Exclude<OutMessage, undefined>
      : never
    : never
  : never

type CommandMessageOfReturn<Output> = Output extends unknown
  ? 'commands' extends keyof Output
    ? Output extends Readonly<{ commands?: infer Commands }>
      ? NonNullable<Commands> extends ReadonlyArray<infer CommandValue>
        ? CommandValue extends Command<infer CommandMessage, any, any>
          ? CommandMessage
          : never
        : never
      : never
    : never
  : never

type IsAny<Value> = 0 extends 1 & Value ? true : false

type ValidViewInputs<ViewInputs> =
  IsAny<ViewInputs> extends true
    ? never
    : [ViewInputs] extends [never]
      ? never
      : [ViewInputs] extends [void]
        ? never
        : ViewInputs

type ViewWithInputs<Model, Message, ViewInputs, RequiredMountRequirements> = [
  ValidViewInputs<ViewInputs>,
] extends [never]
  ? never
  : (
      model: Model,
      viewInputs: NoInfer<ValidViewInputs<ViewInputs>>,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null

type OwnedReturn<Model, Message, OutMessage> = Readonly<{
  model: Model
  commands?: Update.Commands<Message, any> | undefined
  outMessage?: OutMessage
}>

type HasAnyContext<Context extends ReadonlyArray<unknown>> =
  Context extends readonly []
    ? false
    : Context extends readonly [infer Head, ...infer Tail]
      ? IsAny<Head> extends true
        ? true
        : HasAnyContext<Tail>
      : IsAny<Context[number]>

type ValidateAnnotatedContext<Context extends ReadonlyArray<unknown>> =
  HasAnyContext<Context> extends true
    ? Readonly<{
        'Block context parameters cannot use any': Context
      }>
    : unknown

/** @internal Type-only identity for Application update source evidence. */
export declare const DefinedUpdateSourceTypeId: unique symbol

/** @internal Retains an Application update's source type for root completion. */
export type DefinedUpdateSource<Source> = Readonly<{
  [DefinedUpdateSourceTypeId]: Source
}>

/** @internal The nameable contract returned by a Block update authoring helper. */
export type DefinedUpdate<
  Model,
  Message,
  Context extends ReadonlyArray<unknown>,
  OutMessage,
  R,
  Evidence,
> = (
  model: Model,
  message: Message,
  ...context: Context
) => Update.WithRegistrationEvidence<
  [OutMessage] extends [never]
    ? Update.Return<Model, Message, R>
    : Update.ReturnWithOutMessage<Model, Message, OutMessage, R>,
  Evidence
>

/** @internal The nameable contract returned by a Block Step authoring helper. */
export type DefinedStep<
  Model,
  Message,
  Context extends ReadonlyArray<unknown>,
  OutMessage,
  R,
  Evidence,
> = (
  model: Model,
  ...context: Context
) => Update.WithRegistrationEvidence<
  [OutMessage] extends [never]
    ? Update.Return<Model, Message, R>
    : Update.ReturnWithOutMessage<Model, Message, OutMessage, R>,
  Evidence
>

type OwnedAuthoredView<
  View,
  OwnerValue,
  Model,
  Message,
  RequiredMountRequirements,
> = Readonly<{
  __blockViewOwner: OwnerValue
  __blockDefinitionView: Readonly<{
    owner: (value: OwnerValue) => OwnerValue
    model: (value: Model) => Model
    message: (value: Message) => Message
    mountRequirements: () => RequiredMountRequirements
  }>
}> &
  View

/**
 * Refines an authored generic view's per-render inputs while preserving its
 * definition owner, Model, Message, and Mount contract.
 */
export type RefineViewInputs<View extends AnyBlockView, ViewInputs> =
  View extends Readonly<{
    __blockViewOwner: infer OwnerValue
    __blockDefinitionView: Readonly<{
      model: (value: infer Model) => unknown
      message: (value: infer Message) => unknown
      mountRequirements: () => infer RequiredMountRequirements
    }>
  }>
    ? OwnedAuthoredView<
        BlockView<
          Model,
          Message,
          ValidViewInputs<ViewInputs>,
          RequiredMountRequirements
        >,
        OwnerValue,
        Model,
        Message,
        RequiredMountRequirements
      >
    : never

/**
 * Defines a view against one Block's Model, Message, and Mount registry.
 */
export interface DefineView<
  OwnerValue,
  Model,
  Message,
  RequiredMountRequirements,
> {
  (
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => Document,
  ): OwnedAuthoredView<
    DocumentView<Model, Message, RequiredMountRequirements>,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  >
  (
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null,
  ): OwnedAuthoredView<
    BlockView<Model, Message, void, RequiredMountRequirements>,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  >
  readonly withInputs: <ViewInputs = never>(
    view: [ValidViewInputs<ViewInputs>] extends [never]
      ? never
      : (
          model: Model,
          viewInputs: NoInfer<ValidViewInputs<ViewInputs>>,
          h: HtmlBuilder<Message, RequiredMountRequirements>,
        ) => VNode | null,
  ) => OwnedAuthoredView<
    BlockView<
      Model,
      Message,
      ValidViewInputs<ViewInputs>,
      RequiredMountRequirements
    >,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  >
}

/**
 * Defines the primary update function of an owned Block.
 */
export interface DefineUpdate<
  Model,
  Message,
  OutMessage,
  PreserveSource extends boolean = false,
> {
  <
    const Context extends ReadonlyArray<unknown>,
    const Output extends OwnedReturn<Model, Message, OutMessage> &
      ValidateAnnotatedContext<Context>,
  >(
    update: (model: Model, message: Message, ...context: Context) => Output,
  ): DefinedUpdate<
    Model,
    Message,
    Context,
    OutMessageOfReturn<Output>,
    CommandRequirements<Output>,
    Update.RegistrationEvidenceOf<Output>
  > &
    ([PreserveSource] extends [true]
      ? DefinedUpdateSource<readonly [Model, Message, Context, Output]>
      : unknown)
}

/**
 * Defines a named public Step of an owned Block.
 */
export interface DefineStep<Model, Message, OutMessage> {
  <
    const Context extends ReadonlyArray<unknown>,
    const Output extends OwnedReturn<Model, Message, OutMessage> &
      ValidateAnnotatedContext<Context>,
  >(
    step: (model: Model, ...context: Context) => Output,
  ): DefinedStep<
    Model,
    Message,
    Context,
    OutMessageOfReturn<Output>,
    CommandRequirements<Output>,
    Update.RegistrationEvidenceOf<Output>
  >
}

type EmittedMessage<Messages extends ReadonlyArray<Schema.Top>> =
  Messages[number]['Type']

/** @internal Constrains declared result Schemas to one owner's Message union. */
export type ValidateOwnedMessages<
  Messages extends ReadonlyArray<Schema.Top>,
  Message,
> =
  IsAny<EmittedMessage<Messages>> extends true
    ? never
    : [Exclude<EmittedMessage<Messages>, Message>] extends [never]
      ? unknown
      : never

type SubscriptionLayer<
  Name extends string,
  Dependencies,
  Message,
  Yielded extends Effect.Effect<unknown, unknown, unknown>,
  StreamRequirements,
> = Readonly<{
  layer: Layer.Layer<
    Subscription.Handler<Name, Dependencies, Message>,
    Effect.Error<Yielded>,
    Exclude<StreamRequirements | Effect.Services<Yielded>, Scope.Scope>
  >
}>

type AnyLayeredSubscription<Model, Message> = Readonly<{
  dependenciesSchema: Schema.Schema<any> & {
    readonly fields: Schema.Struct.Fields
  }
  modelToDependencies: (model: Model) => any
  dependenciesToStream: (
    ...args: ReadonlyArray<any>
  ) => Stream.Stream<Message, never, any>
  name: string
  messages: ReadonlyArray<Schema.Top>
  toLayer: AnyFunction
}>

type SubscriptionDependencies<Entry> =
  Entry extends Readonly<{
    dependenciesSchema: Schema.Schema<infer Dependencies>
  }>
    ? Dependencies
    : never

type SubscriptionServices<Entry> =
  Entry extends Readonly<{
    dependenciesToStream: (
      ...args: ReadonlyArray<any>
    ) => Stream.Stream<any, any, infer Services>
  }>
    ? Services
    : never

/** Defines Subscription registries against one Block's Model and Message. */
export interface DefineSubscriptions<Id extends string, Model, Message> {
  <
    Entries extends Readonly<
      Record<string, AnyLayeredSubscription<Model, Message>>
    >,
  >(
    build: (
      entry: OwnedSubscriptionEntryBuilder<Id, Model, Message>,
    ) => Entries,
  ): Readonly<{
    [Key in keyof Entries]: Entries[Key] &
      Subscription.Subscription<
        Model,
        Message,
        SubscriptionDependencies<Entries[Key]>,
        SubscriptionServices<Entries[Key]>
      >
  }>
}

/** Defines locally named Subscription entries for one Block. */
export interface OwnedSubscriptionEntryBuilder<
  Id extends string,
  Model,
  Message,
> {
  <
    const Name extends string,
    const Fields extends Schema.Struct.Fields,
    const Messages extends ReadonlyArray<Schema.Top>,
    StreamRequirements = never,
    Yielded extends Effect.Effect<unknown, unknown, unknown> = Effect.Effect<
      never,
      never,
      never
    >,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    fields: Fields,
    callbacks: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      modelToDependencies: (model: Model) => Schema.Struct.Type<NoInfer<Fields>>
      keepAliveEquivalence: Equivalence.Equivalence<
        Schema.Struct.Type<NoInfer<Fields>>
      >
      dependenciesToStream?: never
      handler: (() => Generator<
        Yielded,
        (
          dependencies: Schema.Struct.Type<NoInfer<Fields>>,
          readDependencies: () => Schema.Struct.Type<NoInfer<Fields>>,
        ) => Stream.Stream<
          NoInfer<EmittedMessage<Messages>>,
          never,
          StreamRequirements
        >,
        unknown
      >) &
        ValidateHandlerConstruction<Yielded>
    }>,
  ): Subscription.LayeredEntryWithKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Schema.Struct.Type<Fields>,
    Messages
  > &
    SubscriptionLayer<
      `${Id}/${Name}`,
      Schema.Struct.Type<Fields>,
      EmittedMessage<Messages>,
      Yielded,
      StreamRequirements
    >
  <
    const Name extends string,
    const Fields extends Schema.Struct.Fields,
    const Messages extends ReadonlyArray<Schema.Top>,
    StreamRequirements = never,
    Yielded extends Effect.Effect<unknown, unknown, unknown> = Effect.Effect<
      never,
      never,
      never
    >,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    fields: Fields,
    callbacks: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      modelToDependencies: (model: Model) => Schema.Struct.Type<NoInfer<Fields>>
      keepAliveEquivalence?: never
      dependenciesToStream?: never
      handler: (() => Generator<
        Yielded,
        (
          dependencies: Schema.Struct.Type<NoInfer<Fields>>,
        ) => Stream.Stream<
          NoInfer<EmittedMessage<Messages>>,
          never,
          StreamRequirements
        >,
        unknown
      >) &
        ValidateHandlerConstruction<Yielded>
    }>,
  ): Subscription.LayeredEntryWithoutKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Schema.Struct.Type<Fields>,
    Messages
  > &
    SubscriptionLayer<
      `${Id}/${Name}`,
      Schema.Struct.Type<Fields>,
      EmittedMessage<Messages>,
      Yielded,
      StreamRequirements
    >
  <
    const Name extends string,
    const Messages extends ReadonlyArray<Schema.Top>,
    StreamRequirements = never,
    Yielded extends Effect.Effect<unknown, unknown, unknown> = Effect.Effect<
      never,
      never,
      never
    >,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    config: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      dependenciesToStream?: never
      handler: (() => Generator<
        Yielded,
        (
          dependencies: Record<string, never>,
        ) => Stream.Stream<
          NoInfer<EmittedMessage<Messages>>,
          never,
          StreamRequirements
        >,
        unknown
      >) &
        ValidateHandlerConstruction<Yielded>
    }>,
  ): Subscription.LayeredEntryWithoutKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Record<string, never>,
    Messages
  > &
    SubscriptionLayer<
      `${Id}/${Name}`,
      Record<string, never>,
      EmittedMessage<Messages>,
      Yielded,
      StreamRequirements
    >
  <const Name extends string, const Messages extends ReadonlyArray<Schema.Top>>(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    config: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      dependenciesToStream?: never
      handler?: never
    }>,
  ): Subscription.LayeredEntryWithoutKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Record<string, never>,
    Messages
  >
  <
    const Name extends string,
    const Fields extends Schema.Struct.Fields,
    const Messages extends ReadonlyArray<Schema.Top>,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    fields: Fields,
    callbacks: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      modelToDependencies: (model: Model) => Schema.Struct.Type<NoInfer<Fields>>
      keepAliveEquivalence: Equivalence.Equivalence<
        Schema.Struct.Type<NoInfer<Fields>>
      >
      dependenciesToStream?: never
      handler?: never
    }>,
  ): Subscription.LayeredEntryWithKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Schema.Struct.Type<Fields>,
    Messages
  >
  <
    const Name extends string,
    const Fields extends Schema.Struct.Fields,
    const Messages extends ReadonlyArray<Schema.Top>,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    fields: Fields,
    callbacks: Readonly<{
      messages: Messages & ValidateOwnedMessages<NoInfer<Messages>, Message>
      modelToDependencies: (model: Model) => Schema.Struct.Type<NoInfer<Fields>>
      keepAliveEquivalence?: never
      dependenciesToStream?: never
      handler?: never
    }>,
  ): Subscription.LayeredEntryWithoutKeepAlive<
    `${Id}/${Name}`,
    Model,
    EmittedMessage<Messages>,
    Schema.Struct.Type<Fields>,
    Messages
  >
}

type AcquireParams<RequirementsSchema extends Schema.Schema<any>> =
  RequirementsSchema extends Schema.Option<infer ParamsSchema>
    ? ParamsSchema['Type']
    : RequirementsSchema extends Schema.Struct<infer Fields>
      ? Schema.Struct.Type<Fields>
      : RequirementsSchema['Type'] extends Option.Option<infer Params>
        ? Params
        : RequirementsSchema['Type']

/** Defines ManagedResource registries against one Block's Model and Message. */
export interface DefineManagedResources<Id extends string, Model, Message> {
  <
    Entries extends Readonly<
      Record<
        string,
        ManagedResource.Entry<Model, Message, any, any, any, any, any, any>
      >
    >,
  >(
    build: (
      entry: OwnedManagedResourceEntryBuilder<Id, Model, Message>,
    ) => Entries,
  ): Entries
}

/** Defines locally named ManagedResource entries for one Block. */
export interface OwnedManagedResourceEntryBuilder<
  Id extends string,
  Model,
  Message,
> {
  <
    const Name extends string,
    RequirementsSchema extends Schema.Schema<any>,
    Resource extends ManagedResource.ManagedResource<any, any>,
    OnAcquired extends (value: ManagedResource.Value<Resource>) => Message,
    AcquireRequirements = never,
    ReleaseRequirements = never,
    Yielded extends Effect.Effect<unknown, unknown, unknown> = Effect.Effect<
      never,
      never,
      never
    >,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    schema: RequirementsSchema,
    config: Readonly<{
      resource: Resource
      modelToMaybeRequirements: (
        model: Model,
      ) => Schema.Schema.Type<RequirementsSchema>
      onAcquired: OnAcquired
      onReleased: () => Message
      onAcquireError: (error: unknown) => Message
      acquire?: never
      release?: never
      handler: (() => Generator<
        Yielded,
        Readonly<{
          acquire: (
            params: AcquireParams<RequirementsSchema>,
          ) => Effect.Effect<
            NoInfer<ManagedResource.Value<Resource>>,
            unknown,
            AcquireRequirements
          >
          release: (
            value: NoInfer<ManagedResource.Value<Resource>>,
          ) => Effect.Effect<void, unknown, ReleaseRequirements>
        }>,
        unknown
      >) &
        ValidateHandlerConstruction<Yielded>
    }>,
  ): ManagedResource.LayeredEntry<
    `${Id}/${Name}`,
    Model,
    Message,
    Schema.Schema.Type<RequirementsSchema>,
    ManagedResource.Value<Resource>,
    ManagedResource.ServiceOf<Resource>,
    OnAcquired,
    AcquireParams<RequirementsSchema>
  > &
    Readonly<{
      layer: Layer.Layer<
        ManagedResource.Handler<
          `${Id}/${Name}`,
          AcquireParams<RequirementsSchema>,
          ManagedResource.Value<Resource>
        >,
        Effect.Error<Yielded>,
        Exclude<
          AcquireRequirements | ReleaseRequirements | Effect.Services<Yielded>,
          Scope.Scope
        >
      >
    }>
  <
    const Name extends string,
    RequirementsSchema extends Schema.Schema<any>,
    Resource extends ManagedResource.ManagedResource<any, any>,
    OnAcquired extends (value: ManagedResource.Value<Resource>) => Message,
  >(
    name: Name extends '' | `${string}/${string}` | `${string}::${string}`
      ? never
      : Name,
    schema: RequirementsSchema,
    config: Readonly<{
      resource: Resource
      modelToMaybeRequirements: (
        model: Model,
      ) => Schema.Schema.Type<RequirementsSchema>
      onAcquired: OnAcquired
      onReleased: () => Message
      onAcquireError: (error: unknown) => Message
      acquire?: never
      release?: never
      handler?: never
    }>,
  ): ManagedResource.LayeredEntry<
    `${Id}/${Name}`,
    Model,
    Message,
    Schema.Schema.Type<RequirementsSchema>,
    ManagedResource.Value<Resource>,
    ManagedResource.ServiceOf<Resource>,
    OnAcquired,
    AcquireParams<RequirementsSchema>
  >
}

type BindingParentModel<Binding> =
  Binding extends Readonly<{
    fold: infer Fold extends AnyFunction
  }>
    ? Parameters<Fold>[0]
    : never

type StepFactoryOutput<Factory> = Factory extends AnyFunction
  ? ReturnOf<Factory> extends infer Step extends AnyFunction
    ? ReturnOf<Step>
    : never
  : never

type BindingStepFactories<Binding> =
  Binding extends Readonly<{
    __blockBindingBlock: Readonly<{
      steps: infer Steps extends Readonly<Record<string, AnyFunction>>
    }>
  }>
    ? {
        [Name in keyof Steps]: Binding extends Readonly<
          Record<Name, infer Factory>
        >
          ? Factory
          : never
      }[keyof Steps]
    : never

type BindingOutputs<Binding> =
  Binding extends Readonly<{
    fold: infer Fold extends AnyFunction
  }>
    ? ReturnOf<Fold> | StepFactoryOutput<BindingStepFactories<Binding>>
    : never

type InvalidBindingParentModel<Binding, ParentModel> =
  IsAny<BindingParentModel<Binding>> extends true
    ? BindingParentModel<Binding>
    : [BindingParentModel<Binding>, ParentModel] extends [
          ParentModel,
          BindingParentModel<Binding>,
        ]
      ? never
      : BindingParentModel<Binding>

type InvalidChildParentModels<
  Children extends ReadonlyArray<AnyBinding>,
  ParentModel,
> = Children[number] extends infer Binding
  ? InvalidBindingParentModel<Binding, ParentModel>
  : never

type InvalidChildCommandMessages<
  Children extends ReadonlyArray<AnyBinding>,
  ParentMessage,
> = Exclude<
  CommandMessageOfReturn<BindingOutputs<Children[number]>>,
  ParentMessage
>

type InvalidChildOutMessages<
  Children extends ReadonlyArray<AnyBinding>,
  ParentOutMessage,
> = Exclude<
  OutMessageOfReturn<BindingOutputs<Children[number]>>,
  ParentOutMessage
>

/** @internal Checks a registered graph against its owning Model and Messages. */
export type ValidateChildBindings<
  Children extends ReadonlyArray<AnyBinding>,
  ParentModel,
  ParentMessage,
  ParentOutMessage,
> = [
  | InvalidChildParentModels<Children, ParentModel>
  | InvalidChildCommandMessages<Children, ParentMessage>
  | InvalidChildOutMessages<Children, ParentOutMessage>,
] extends [never]
  ? unknown
  : Readonly<{
      'Block child bindings must match the parent Model, Message, and OutMessage':
        | InvalidChildParentModels<Children, ParentModel>
        | InvalidChildCommandMessages<Children, ParentMessage>
        | InvalidChildOutMessages<Children, ParentOutMessage>
    }>

type LayerOutput<LayerRecipe> = LayerRecipe extends Layer.Any
  ? Layer.Success<LayerRecipe>
  : never

type LayerError<LayerRecipe> = LayerRecipe extends Layer.Any
  ? Layer.Error<LayerRecipe>
  : never

type LayerInput<LayerRecipe> = LayerRecipe extends Layer.Any
  ? Layer.Services<LayerRecipe>
  : never

type CompleteEffectsLayer<
  EffectsLayer extends AnyLayer,
  Children extends ReadonlyArray<AnyBinding>,
> = Layer.Layer<
  LayerOutput<EffectsLayer | AggregatedChildren<Children>['EffectsLayer']>,
  LayerError<EffectsLayer | AggregatedChildren<Children>['EffectsLayer']>,
  LayerInput<EffectsLayer | AggregatedChildren<Children>['EffectsLayer']>
>

type DefinitionViewMountRequirements<
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Mount.RequirementsOf<Mounts> | RequirementsOfBindings<Children>

type OutMessageSchemaField<OutMessageSchema> =
  OutMessageSchema extends AnySchema
    ? Readonly<{ OutMessage: OutMessageSchema }>
    : Readonly<{ OutMessage?: never }>

type ImplementationSteps<Implementation> =
  Implementation extends Readonly<{ steps: infer Steps }> ? Steps : EmptyRecord

type ImplementationSubscriptions<Implementation> =
  Implementation extends Readonly<{ subscriptions: infer Subscriptions }>
    ? Subscriptions
    : EmptyRecord

type ImplementationManagedResources<Implementation> =
  Implementation extends Readonly<{ managedResources: infer ManagedResources }>
    ? ManagedResources
    : EmptyRecord

type ImplementationHostHandlers<Implementation> =
  Implementation extends Readonly<{ hostHandlers: infer HostHandlers }>
    ? HostHandlers
    : readonly []

/**
 * The channels supplied to a Block definition's `assemble` method. The
 * block retains the exact types of the supplied functions,
 * registrations, and local Layer recipe. Check an implementation with
 * `satisfies Implementation<Model, Message, OutMessage>` to retain its inferred
 * service requirements; annotating it with this broad type erases them.
 */
export type Implementation<Model, Message, OutMessage = never> = Readonly<{
  view?: AnyAuthoredView
  init(...args: ReadonlyArray<unknown>): OwnedReturn<Model, Message, never>
  update(
    model: Model,
    message: Message,
    ...context: ReadonlyArray<unknown>
  ): OwnedReturn<Model, Message, OutMessage>
  steps?: Readonly<
    Record<
      string,
      {
        step(
          model: Model,
          ...context: ReadonlyArray<unknown>
        ): OwnedReturn<Model, Message, OutMessage>
      }['step']
    >
  >
  subscriptions?: Subscription.Subscriptions<Model, Message, any>
  managedResources?: Readonly<
    Record<
      string,
      ManagedResource.Entry<Model, Message, any, any, any, any, any, any>
    >
  >
  EffectsLayer: Layer.Layer<never, any, any> | Layer.Layer<any, any, any>
  hostHandlers?: ReadonlyArray<unknown>
}>

type DefinitionImplementation<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema,
> = Implementation<
  ModelSchema['Type'],
  MessageSchema['Type'],
  OutMessageSchema extends AnySchema ? OutMessageSchema['Type'] : never
>

type ExtraImplementationKeys<ImplementationValue> = Exclude<
  keyof ImplementationValue,
  keyof Implementation<any, any, any>
>

type ExactImplementationKeys<ImplementationValue> = [
  ExtraImplementationKeys<ImplementationValue>,
] extends [never]
  ? unknown
  : Readonly<{
      [Key in ExtraImplementationKeys<ImplementationValue>]: never
    }>

type CheckedImplementationValue<ImplementationValue> =
  ImplementationValue extends Readonly<{
    init: infer Init extends AnyFunction
    update: infer UpdateFunction extends AnyFunction
    EffectsLayer: infer EffectsLayer extends AnyLayer
  }>
    ? ImplementationValue &
        Readonly<{
          init: Init
          update: UpdateFunction
          EffectsLayer: EffectsLayer
        }>
    : never

type PublicProducer<Producer, Model, Message> = Producer extends AnyFunction
  ? [Update.RegistrationEvidenceOf<ReturnOf<Producer>>] extends [never]
    ? Producer
    : (
        ...args: Parameters<Producer>
      ) => [OutMessageOfReturn<ReturnOf<Producer>>] extends [never]
        ? Update.Return<Model, Message, CommandRequirements<ReturnOf<Producer>>>
        : Update.ReturnWithOutMessage<
            Model,
            Message,
            OutMessageOfReturn<ReturnOf<Producer>>,
            CommandRequirements<ReturnOf<Producer>>
          >
  : never

type PublicImplementationValue<Model, Message, ImplementationValue> = Readonly<{
  [Key in keyof ImplementationValue]: Key extends 'init' | 'update'
    ? PublicProducer<ImplementationValue[Key], Model, Message>
    : Key extends 'steps'
      ? ImplementationValue[Key] extends Readonly<Record<string, AnyFunction>>
        ? Readonly<{
            [Step in keyof ImplementationValue[Key]]: PublicProducer<
              ImplementationValue[Key][Step],
              Model,
              Message
            >
          }>
        : ImplementationValue[Key]
      : ImplementationValue[Key]
}>

type DefaultEffectsImplementation<ImplementationValue> = Readonly<{
  [
    Key in keyof ImplementationValue | 'EffectsLayer'
  ]: Key extends 'EffectsLayer'
    ? typeof Layer.empty
    : Key extends keyof ImplementationValue
      ? ImplementationValue[Key]
      : never
}>

type ManagedImplementation<
  Init,
  UpdateFunction,
  View,
  ManagedResources,
  EffectsLayer,
> = Readonly<{
  init: Init
  update: UpdateFunction
  view: View
  managedResources: ManagedResources
  EffectsLayer: EffectsLayer
}>

type ManagedSubscriptionImplementation<
  Init,
  UpdateFunction,
  View,
  Subscriptions,
  ManagedResources,
  EffectsLayer,
> = ManagedImplementation<
  Init,
  UpdateFunction,
  View,
  ManagedResources,
  EffectsLayer
> &
  Readonly<{ subscriptions: Subscriptions }>

type ViewImplementation<Init, UpdateFunction, View, EffectsLayer> = Readonly<{
  init: Init
  update: UpdateFunction
  view: View
  EffectsLayer: EffectsLayer
}>

type ViewStepsImplementation<Init, UpdateFunction, View, Steps, EffectsLayer> =
  Readonly<{
    init: Init
    update: UpdateFunction
    view: View
    steps: Steps
    EffectsLayer: EffectsLayer
  }>

type ViewSubscriptionsImplementation<
  Init,
  UpdateFunction,
  View,
  Subscriptions,
  EffectsLayer,
> = Readonly<{
  init: Init
  update: UpdateFunction
  view: View
  subscriptions: Subscriptions
  EffectsLayer: EffectsLayer
}>

type ViewSubscriptionImplementation<
  Init,
  UpdateFunction,
  View,
  Subscriptions,
  EffectsLayer,
  AdditionalImplementation = unknown,
> = ViewSubscriptionsImplementation<
  Init,
  UpdateFunction,
  View,
  Subscriptions,
  EffectsLayer
> &
  AdditionalImplementation

type BasicImplementation<Init, UpdateFunction, EffectsLayer> = Readonly<{
  init: Init
  update: UpdateFunction
  EffectsLayer: EffectsLayer
}>

type ValidateInit<ImplementationValue> =
  ImplementationValue extends Readonly<{ init: infer Init extends AnyFunction }>
    ? [OutMessageOfReturn<ReturnOf<Init>>] extends [never]
      ? unknown
      : Readonly<{
          'Block init cannot emit an OutMessage': OutMessageOfReturn<
            ReturnOf<Init>
          >
        }>
    : unknown

type ViewProperty<View, Key extends PropertyKey> = Key extends keyof View
  ? View[Key]
  : never

/** @internal Compact authored-view contract used by implementation overloads. */
export type DefinitionAuthoredView<
  OwnerValue,
  Model,
  Message,
  AllowedMountRequirements,
> = AnyAuthoredView &
  Readonly<{
    __blockDefinitionView: Readonly<{
      owner: (value: OwnerValue) => OwnerValue
      model: (value: Model) => Model
      message: (value: Message) => Message
      mountRequirements: () => AllowedMountRequirements
    }>
  }>

/** @internal Authored-view contract derived from one Block definition. */
export type DefinitionView<
  OwnerValue,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = DefinitionAuthoredView<
  OwnerValue,
  ModelSchema['Type'],
  MessageSchema['Type'],
  DefinitionViewMountRequirements<Mounts, Children>
>

type ValidateViewOwner<View, OwnerValue> =
  View extends Readonly<{ __blockViewOwner: infer ViewOwner }>
    ? [ViewOwner, OwnerValue] extends [OwnerValue, ViewOwner]
      ? unknown
      : Readonly<{
          'Block view must be authored by its definition': ViewOwner
        }>
    : Readonly<{
        'Block view must be authored by its definition': View
      }>

type ValidateViewChannels<
  ViewModel,
  ViewMessage,
  RequiredMountRequirements,
  Model,
  Message,
  AllowedMountRequirements,
> = [Model] extends [ViewModel]
  ? [ViewMessage] extends [Message]
    ? [Exclude<RequiredMountRequirements, AllowedMountRequirements>] extends [
        never,
      ]
      ? unknown
      : Readonly<{
          'Block view requires Mounts absent from its definition': Exclude<
            RequiredMountRequirements,
            AllowedMountRequirements
          >
        }>
    : Readonly<{
        'Block view must use the definition Model and Message': ViewMessage
      }>
  : Readonly<{
      'Block view must use the definition Model and Message': ViewModel
    }>

type ValidateView<
  ImplementationValue extends object,
  OwnerValue,
  Model,
  Message,
  AllowedMountRequirements,
> = 'view' extends keyof ImplementationValue
  ? IsAny<ImplementationValue['view']> extends true
    ? Readonly<{
        'Block view cannot use any': never
      }>
    : ValidateViewOwner<ImplementationValue['view'], OwnerValue> &
        ValidateViewChannels<
          ViewProperty<ImplementationValue['view'], '__blockModel'>,
          ViewProperty<ImplementationValue['view'], '__blockMessage'>,
          ViewProperty<ImplementationValue['view'], '__blockMountRequirements'>,
          Model,
          Message,
          AllowedMountRequirements
        >
  : unknown

type ValidateDefinitionView<
  View extends Readonly<{ __blockDefinitionView: unknown }>,
> = unknown extends View
  ? Readonly<{
      'Block view cannot use any': never
    }>
  : unknown

type ValidateViewForDefinition<
  View extends DefinitionView<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    Mounts,
    Children
  >,
  OwnerValue,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = ValidateDefinitionView<View>

type ImplementationForValidation<
  OwnerValue,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  ImplementationValue extends Readonly<{
    init: AnyFunction
    update: AnyFunction
    EffectsLayer: AnyLayer
  }>,
> = Readonly<{
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: Mounts
  [LocalMountsTypeId]: Mounts
  children: Children
  init: ImplementationValue['init']
  update: ImplementationValue['update']
  steps: ImplementationSteps<ImplementationValue>
  subscriptions: ImplementationSubscriptions<ImplementationValue>
  managedResources: ImplementationManagedResources<ImplementationValue>
  EffectsLayer: CompleteEffectsLayer<
    ImplementationValue['EffectsLayer'],
    Children
  >
  hostHandlers: ImplementationHostHandlers<ImplementationValue>
}> &
  OutMessageSchemaField<OutMessageSchema>

type MergeLayers<Left extends Layer.Any, Right extends Layer.Any> = Layer.Layer<
  Layer.Success<Left | Right>,
  Layer.Error<Left | Right>,
  Layer.Services<Left | Right>
>

type HostDefinitions<ImplementationValue> =
  ImplementationValue extends Readonly<{
    hostHandlers: infer Definitions extends ReadonlyArray<unknown>
  }>
    ? Definitions[number]
    : never

type ProvidedHandlerContracts<HandlersLayer> = HandlersLayer extends Layer.Any
  ? HandlerRequirements<Layer.Success<HandlersLayer>>
  : never

type MissingProvidedHandlers<ImplementationValue, HandlersLayer> = Exclude<
  HandlerOfHostDefinition<HostDefinitions<ImplementationValue>>,
  ProvidedHandlerContracts<HandlersLayer>
>

type UnexpectedProvidedHandlers<ImplementationValue, HandlersLayer> = Exclude<
  ProvidedHandlerContracts<HandlersLayer>,
  HandlerOfHostDefinition<HostDefinitions<ImplementationValue>>
>

type ValidateProvidedHandlers<ImplementationValue, HandlersLayer> =
  IsAny<ProvidedHandlerContracts<HandlersLayer>> extends true
    ? Readonly<{
        'Block provideHandlers Layer must preserve exact handler contracts': ProvidedHandlerContracts<HandlersLayer>
      }>
    : [
          | MissingProvidedHandlers<ImplementationValue, HandlersLayer>
          | UnexpectedProvidedHandlers<ImplementationValue, HandlersLayer>,
        ] extends [never]
      ? unknown
      : Readonly<{
          'Block provideHandlers Layer must exactly match declared host handlers':
            | MissingProvidedHandlers<ImplementationValue, HandlersLayer>
            | UnexpectedProvidedHandlers<ImplementationValue, HandlersLayer>
        }>

type ProvideHandlerImplementation<
  ImplementationValue extends Readonly<{ EffectsLayer: Layer.Any }>,
  HandlersLayer extends Layer.Any,
> = Readonly<{
  [
    Key in keyof ImplementationValue | 'hostHandlers'
  ]: Key extends 'EffectsLayer'
    ? MergeLayers<ImplementationValue['EffectsLayer'], HandlersLayer>
    : Key extends 'hostHandlers'
      ? readonly []
      : Key extends keyof ImplementationValue
        ? ImplementationValue[Key]
        : never
}>

/**
 * The passive contract produced after a Block definition is assembled.
 * It carries every lifecycle registration, Layer recipe, public Step, and
 * child binding needed to install the Block in a parent.
 */
export type Block<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  ImplementationValue extends Readonly<{
    init: AnyFunction
    update: AnyFunction
    EffectsLayer: AnyLayer
  }>,
> = Readonly<{
  /** @internal Runtime identity bridge used while lowering child bindings. */
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: readonly [
    ...Mounts,
    ...ReadonlyArray<Children[number]['mounts'][number]>,
  ]
  /** @internal Retains the exact Mount definitions owned by this block. */
  [LocalMountsTypeId]: Mounts
  children: Children
  init: ImplementationValue['init']
  update: ImplementationValue['update']
  steps: ImplementationValue extends Readonly<{
    steps: infer Steps extends Readonly<
      Record<string, (...args: ReadonlyArray<any>) => any>
    >
  }>
    ? Steps
    : Readonly<Record<never, never>>
  subscriptions: (ImplementationValue extends Readonly<{
    subscriptions: infer Subscriptions extends Subscription.Subscriptions<
      any,
      any,
      any
    >
  }>
    ? Subscriptions
    : Readonly<Record<never, never>>) &
    AggregatedChildren<Children>['subscriptions']
  managedResources: (ImplementationValue extends Readonly<{
    managedResources: infer ManagedResources extends Readonly<
      Record<
        string,
        ManagedResource.Entry<any, any, any, any, any, any, any, any>
      >
    >
  }>
    ? ManagedResources
    : Readonly<Record<never, never>>) &
    AggregatedChildren<Children>['managedResources']
  EffectsLayer: Layer.Layer<
    Layer.Success<
      ImplementationValue['EffectsLayer'] | Children[number]['EffectsLayer']
    >,
    Layer.Error<
      ImplementationValue['EffectsLayer'] | Children[number]['EffectsLayer']
    >,
    Layer.Services<
      ImplementationValue['EffectsLayer'] | Children[number]['EffectsLayer']
    >
  >
  /** @internal Retains the selected local Layer before child aggregation. */
  [LocalEffectsLayerTypeId]: ImplementationValue['EffectsLayer']
  /** @internal Retains compact unresolved handler evidence for root assembly. */
  __blockHandlerRequirements: HandlerEvidence<
    ImplementationValue['EffectsLayer'],
    ImplementationHostHandlers<ImplementationValue>,
    Children
  >
  hostHandlers: ImplementationValue extends Readonly<{
    hostHandlers: infer HostHandlers extends ReadonlyArray<unknown>
  }>
    ? HostHandlers
    : readonly []
}> &
  (OutMessageSchema extends Schema.Codec<any, any, any, any>
    ? Readonly<{ OutMessage: OutMessageSchema }>
    : Readonly<{ OutMessage?: never }>) &
  (ImplementationValue extends Readonly<{
    view: infer View extends AnyAuthoredView
  }>
    ? Readonly<{ [DefaultViewTypeId]: View }>
    : Readonly<{ [DefaultViewTypeId]?: never }>) &
  Readonly<{
    view: DefineView<
      OwnerValue,
      ModelSchema['Type'],
      MessageSchema['Type'],
      DefinitionViewMountRequirements<Mounts, Children>
    >
    /**
     * Selects a replacement local Layer recipe and retains the selected child
     * graph. The returned block keeps the Owner, operations, lifecycle
     * registrations, and host handler contract. Selection builds no services
     * and never constructs the previous local recipe.
     */
    replaceEffectsLayer: <
      const SelectedEffectsLayer extends
        | Layer.Layer<never, any, any>
        | Layer.Layer<any, any, any>,
    >(
      EffectsLayer: SelectedEffectsLayer &
        ValidateComposition<
          Definition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children
          >,
          Block<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            Readonly<{
              [Key in keyof ImplementationValue]: Key extends 'EffectsLayer'
                ? SelectedEffectsLayer
                : ImplementationValue[Key]
            }>
          >
        >,
    ) => Block<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      OutMessageSchema,
      Mounts,
      Children,
      Readonly<{
        [Key in keyof ImplementationValue]: Key extends 'EffectsLayer'
          ? SelectedEffectsLayer
          : ImplementationValue[Key]
      }>
    >
    /**
     * Supplies the declared host-owned handler services with an ordinary Layer.
     */
    provideHandlers: [
      ImplementationHostHandlers<ImplementationValue>[number],
    ] extends [never]
      ? never
      : <const HandlersLayer extends AnyLayer>(
          HandlersLayer: HandlersLayer &
            ValidateProvidedHandlers<ImplementationValue, HandlersLayer>,
        ) => Block<
          OwnerValue,
          ModelSchema,
          MessageSchema,
          OutMessageSchema,
          Mounts,
          Children,
          ProvideHandlerImplementation<ImplementationValue, HandlersLayer>
        >
    connection: Bind<
      Block<
        OwnerValue,
        ModelSchema,
        MessageSchema,
        OutMessageSchema,
        Mounts,
        Children,
        ImplementationValue
      >
    >
    keyedConnection: BindEach<
      Block<
        OwnerValue,
        ModelSchema,
        MessageSchema,
        OutMessageSchema,
        Mounts,
        Children,
        ImplementationValue
      >
    >
  }>

/** @internal Nameable declaration boundary for an assembled Block. */
export type CompletedBlock<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  ImplementationValue extends Readonly<{
    init: AnyFunction
    update: AnyFunction
    EffectsLayer: AnyLayer
  }>,
> = Block<
  OwnerValue,
  ModelSchema,
  MessageSchema,
  OutMessageSchema,
  Mounts,
  Children,
  ImplementationValue
>

/**
 * The completed block produced by assembling an authored definition.
 * This compact alias lets published component packages name an inferred
 * block without expanding its full child graph into their declarations.
 */
export type Completed<DefinitionValue, ImplementationValue> =
  DefinitionValue extends Readonly<{
    owner: infer OwnerValue extends Owner<string>
    Model: infer ModelSchema extends AnySchema
    Message: infer MessageSchema extends AnySchema
    [LocalMountsTypeId]: infer Mounts extends
      ReadonlyArray<Mount.LayeredMountDefinition>
    children: infer Children extends ReadonlyArray<AnyBinding>
  }>
    ? ImplementationValue extends Readonly<{
        init: AnyFunction
        update: AnyFunction
        EffectsLayer: AnyLayer
      }>
      ? CompletedBlock<
          OwnerValue,
          ModelSchema,
          MessageSchema,
          DefinitionValue extends Readonly<{
            OutMessage: infer OutMessageSchema extends AnySchema
          }>
            ? OutMessageSchema
            : undefined,
          Mounts,
          Children,
          PublicImplementationValue<
            ModelSchema['Type'],
            MessageSchema['Type'],
            ImplementationValue
          >
        >
      : never
    : never

/** @internal Retains operation evidence while validating an application root. */
export type CompletedForValidation<DefinitionValue, ImplementationValue> =
  DefinitionValue extends Readonly<{
    owner: infer OwnerValue extends Owner<string>
    Model: infer ModelSchema extends AnySchema
    Message: infer MessageSchema extends AnySchema
    [LocalMountsTypeId]: infer Mounts extends
      ReadonlyArray<Mount.LayeredMountDefinition>
    children: infer Children extends ReadonlyArray<AnyBinding>
  }>
    ? ImplementationValue extends Readonly<{
        init: AnyFunction
        update: AnyFunction
        EffectsLayer: AnyLayer
      }>
      ? Block<
          OwnerValue,
          ModelSchema,
          MessageSchema,
          DefinitionValue extends Readonly<{
            OutMessage: infer OutMessageSchema extends AnySchema
          }>
            ? OutMessageSchema
            : undefined,
          Mounts,
          Children,
          ImplementationValue
        >
      : never
    : never

/**
 * Structural bound for any assembled Block.
 */
export type AnyBlock = Readonly<{
  owner: Owner<any>
  Model: AnySchema
  Message: AnySchema
  mounts: ReadonlyArray<Mount.LayeredMountDefinition>
  [LocalMountsTypeId]: ReadonlyArray<Mount.LayeredMountDefinition>
  children: ReadonlyArray<AnyBinding>
  init: AnyFunction
  update: AnyFunction
  steps: Readonly<Record<string, AnyFunction>>
  subscriptions: AnySubscriptions
  managedResources: AnyManagedResources
  EffectsLayer: AnyLayer
  [LocalEffectsLayerTypeId]: AnyLayer
  __blockHandlerRequirements?: unknown
  hostHandlers: ReadonlyArray<unknown>
  view: AnyFunction
  [DefaultViewTypeId]?: AnyAuthoredView
  OutMessage?: AnySchema
  replaceEffectsLayer: AnyFunction
  provideHandlers: AnyFunction
  connection: AnyFunction
  keyedConnection: AnyFunction
}>

type ManagedStepsImplementation<
  Init,
  UpdateFunction,
  View,
  ManagedResources,
  Steps,
  EffectsLayer,
> = ManagedImplementation<
  Init,
  UpdateFunction,
  View,
  ManagedResources,
  EffectsLayer
> &
  Readonly<{ steps: Steps }>

type AssemblyDefinition<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Definition<
  OwnerValue,
  ModelSchema,
  MessageSchema,
  OutMessageSchema,
  Mounts,
  Children
>

type AssemblyCompositionForValidation<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  ImplementationValue,
> = ImplementationForValidation<
  OwnerValue,
  ModelSchema,
  MessageSchema,
  OutMessageSchema,
  Mounts,
  Children,
  CheckedImplementationValue<ImplementationValue>
>

type ValidateAssemblyComposition<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  ImplementationValue,
> = ValidateImplementationComposition<
  AssemblyDefinition<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  >,
  AssemblyCompositionForValidation<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    ImplementationValue
  >
>

type PublicAssemblyImplementation<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  ImplementationValue,
> = PublicImplementationValue<
  ModelSchema['Type'],
  MessageSchema['Type'],
  CheckedImplementationValue<ImplementationValue>
>

/**
 * Completes an owned Block definition with its implementation channels.
 */
export interface AssembleBlock<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> {
  <const Init, const UpdateFunction, const EffectsLayer>(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<BasicImplementation<Init, UpdateFunction, EffectsLayer>>
        >
      update: UpdateFunction
      view?: never
      subscriptions?: never
      managedResources?: never
      steps?: never
      hostHandlers?: never
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            BasicImplementation<Init, UpdateFunction, EffectsLayer>
          >
        >
    }> &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      BasicImplementation<Init, UpdateFunction, EffectsLayer>
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ViewImplementation<Init, UpdateFunction, View, EffectsLayer>
          >
        >
      update: UpdateFunction
      view: View
      subscriptions?: never
      managedResources?: never
      steps?: never
      hostHandlers?: never
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ViewImplementation<Init, UpdateFunction, View, EffectsLayer>
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ViewImplementation<Init, UpdateFunction, View, EffectsLayer>
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const Subscriptions,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ViewSubscriptionsImplementation<
              Init,
              UpdateFunction,
              View,
              Subscriptions,
              EffectsLayer
            >
          >
        >
      update: UpdateFunction
      view: View
      subscriptions: Subscriptions
      managedResources?: never
      steps?: never
      hostHandlers?: never
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ViewSubscriptionsImplementation<
              Init,
              UpdateFunction,
              View,
              Subscriptions,
              EffectsLayer
            >
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ViewSubscriptionsImplementation<
        Init,
        UpdateFunction,
        View,
        Subscriptions,
        EffectsLayer
      >
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const Subscriptions,
    const EffectsLayer,
    const AdditionalImplementation extends object,
  >(
    implementation: AdditionalImplementation &
      Readonly<{
        init: Init &
          NoInfer<
            ValidateInit<
              ViewSubscriptionImplementation<
                Init,
                UpdateFunction,
                View,
                Subscriptions,
                EffectsLayer,
                AdditionalImplementation
              >
            >
          >
        update: UpdateFunction
        view: View
        subscriptions: Subscriptions
        EffectsLayer: EffectsLayer &
          NoInfer<
            ValidateAssemblyComposition<
              OwnerValue,
              ModelSchema,
              MessageSchema,
              OutMessageSchema,
              Mounts,
              Children,
              ViewSubscriptionImplementation<
                Init,
                UpdateFunction,
                View,
                Subscriptions,
                EffectsLayer,
                AdditionalImplementation
              >
            >
          >
      }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ViewSubscriptionImplementation<
        Init,
        UpdateFunction,
        View,
        Subscriptions,
        EffectsLayer,
        AdditionalImplementation
      >
    >
  >
  <const ImplementationValue extends object>(
    implementation: ImplementationValue &
      NoInfer<
        Omit<
          Implementation<
            ModelSchema['Type'],
            MessageSchema['Type'],
            OutMessageSchema extends Schema.Codec<any, any, any, any>
              ? OutMessageSchema['Type']
              : never
          >,
          'EffectsLayer'
        > &
          Readonly<{ EffectsLayer?: never }>
      > &
      ExactImplementationKeys<ImplementationValue> &
      ValidateInit<ImplementationValue> &
      ValidateView<
        ImplementationValue,
        OwnerValue,
        ModelSchema['Type'],
        MessageSchema['Type'],
        DefinitionViewMountRequirements<Mounts, Children>
      > &
      ValidateAssemblyComposition<
        OwnerValue,
        ModelSchema,
        MessageSchema,
        OutMessageSchema,
        Mounts,
        Children,
        DefaultEffectsImplementation<ImplementationValue>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      DefaultEffectsImplementation<ImplementationValue>
    >
  >
  <
    const ErasedImplementation extends Implementation<
      ModelSchema['Type'],
      MessageSchema['Type'],
      OutMessageSchema extends Schema.Codec<any, any, any, any>
        ? OutMessageSchema['Type']
        : never
    >,
  >(
    implementation: ErasedImplementation &
      (Implementation<
        ModelSchema['Type'],
        MessageSchema['Type'],
        OutMessageSchema extends Schema.Codec<any, any, any, any>
          ? OutMessageSchema['Type']
          : never
      > extends ErasedImplementation
        ? unknown
        : never),
  ): never
  <const ImplementationValue extends object>(
    implementation: ImplementationValue &
      NoInfer<
        Implementation<
          ModelSchema['Type'],
          MessageSchema['Type'],
          OutMessageSchema extends Schema.Codec<any, any, any, any>
            ? OutMessageSchema['Type']
            : never
        >
      > &
      ExactImplementationKeys<ImplementationValue> &
      ValidateInit<ImplementationValue> &
      ValidateView<
        ImplementationValue,
        OwnerValue,
        ModelSchema['Type'],
        MessageSchema['Type'],
        DefinitionViewMountRequirements<Mounts, Children>
      > &
      ValidateAssemblyComposition<
        OwnerValue,
        ModelSchema,
        MessageSchema,
        OutMessageSchema,
        Mounts,
        Children,
        ImplementationValue
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ImplementationValue
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const ManagedResources,
    const Steps,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ManagedStepsImplementation<
              Init,
              UpdateFunction,
              View,
              ManagedResources,
              Steps,
              EffectsLayer
            >
          >
        >
      update: UpdateFunction
      view: View
      managedResources: ManagedResources
      steps: Steps
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ManagedStepsImplementation<
              Init,
              UpdateFunction,
              View,
              ManagedResources,
              Steps,
              EffectsLayer
            >
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ManagedStepsImplementation<
        Init,
        UpdateFunction,
        View,
        ManagedResources,
        Steps,
        EffectsLayer
      >
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const ManagedResources,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ManagedImplementation<
              Init,
              UpdateFunction,
              View,
              ManagedResources,
              EffectsLayer
            >
          >
        >
      update: UpdateFunction
      view: View
      managedResources: ManagedResources
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ManagedImplementation<
              Init,
              UpdateFunction,
              View,
              ManagedResources,
              EffectsLayer
            >
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ManagedImplementation<
        Init,
        UpdateFunction,
        View,
        ManagedResources,
        EffectsLayer
      >
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const Subscriptions,
    const ManagedResources,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ManagedSubscriptionImplementation<
              Init,
              UpdateFunction,
              View,
              Subscriptions,
              ManagedResources,
              EffectsLayer
            >
          >
        >
      update: UpdateFunction
      view: View
      subscriptions: Subscriptions
      managedResources: ManagedResources
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ManagedSubscriptionImplementation<
              Init,
              UpdateFunction,
              View,
              Subscriptions,
              ManagedResources,
              EffectsLayer
            >
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ManagedSubscriptionImplementation<
        Init,
        UpdateFunction,
        View,
        Subscriptions,
        ManagedResources,
        EffectsLayer
      >
    >
  >
  <
    const Init,
    const UpdateFunction,
    const View extends DefinitionView<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      Mounts,
      Children
    >,
    const Steps,
    const EffectsLayer,
  >(
    implementation: Readonly<{
      init: Init &
        NoInfer<
          ValidateInit<
            ViewStepsImplementation<
              Init,
              UpdateFunction,
              View,
              Steps,
              EffectsLayer
            >
          >
        >
      update: UpdateFunction
      view: View
      steps: Steps
      EffectsLayer: EffectsLayer &
        NoInfer<
          ValidateAssemblyComposition<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            ViewStepsImplementation<
              Init,
              UpdateFunction,
              View,
              Steps,
              EffectsLayer
            >
          >
        >
    }> &
      NoInfer<
        ValidateViewForDefinition<
          View,
          OwnerValue,
          ModelSchema,
          MessageSchema,
          Mounts,
          Children
        >
      > &
      NoInfer<
        DefinitionImplementation<ModelSchema, MessageSchema, OutMessageSchema>
      >,
  ): CompletedBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    PublicAssemblyImplementation<
      ModelSchema,
      MessageSchema,
      ViewStepsImplementation<Init, UpdateFunction, View, Steps, EffectsLayer>
    >
  >
}

/**
 * The builder supplied by an authored definition. Use this type when extracted
 * view helpers render that definition's registered children or local Mounts.
 */
export type HtmlBuilderOf<DefinitionValue> =
  DefinitionValue extends Readonly<{
    Message: Readonly<{ Type: infer Message }>
    [LocalMountsTypeId]: infer Mounts extends
      ReadonlyArray<Mount.LayeredMountDefinition>
    children: infer Children extends ReadonlyArray<AnyBinding>
  }>
    ? HtmlBuilder<Message, DefinitionViewMountRequirements<Mounts, Children>>
    : never

/**
 * The authoring contract created by `Block.define`.
 */
export type Definition<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  /** @internal Runtime identity shared by the definition and completed block. */
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: readonly [
    ...Mounts,
    ...ReadonlyArray<Children[number]['mounts'][number]>,
  ]
  /** @internal Retains the exact Mount definitions owned by this definition. */
  [LocalMountsTypeId]: Mounts
  children: Children
  view: DefineView<
    OwnerValue,
    ModelSchema['Type'],
    MessageSchema['Type'],
    DefinitionViewMountRequirements<Mounts, Children>
  >
  update: DefineUpdate<
    ModelSchema['Type'],
    MessageSchema['Type'],
    OutMessageSchema extends Schema.Codec<any, any, any, any>
      ? OutMessageSchema['Type']
      : never
  >
  step: DefineStep<
    ModelSchema['Type'],
    MessageSchema['Type'],
    OutMessageSchema extends Schema.Codec<any, any, any, any>
      ? OutMessageSchema['Type']
      : never
  >
  subscriptions: DefineSubscriptions<
    OwnerValue['id'],
    ModelSchema['Type'],
    MessageSchema['Type']
  >
  managedResources: DefineManagedResources<
    OwnerValue['id'],
    ModelSchema['Type'],
    MessageSchema['Type']
  >
  assemble: AssembleBlock<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  >
}> &
  (OutMessageSchema extends Schema.Codec<any, any, any, any>
    ? Readonly<{ OutMessage: OutMessageSchema }>
    : Readonly<{ OutMessage?: never }>)

/**
 * Registered graph capabilities together with the established typed authoring helpers.
 */
export type Composition<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Pick<
  Definition<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  >,
  | 'owner'
  | 'Model'
  | 'Message'
  | 'OutMessage'
  | 'mounts'
  | typeof LocalMountsTypeId
  | 'children'
  | 'update'
  | 'step'
  | 'subscriptions'
  | 'managedResources'
  | 'view'
  | 'assemble'
>

/**
 * Registers children and Mounts after the Block's typed operations are authored.
 */
export interface Register<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
> {
  <
    const Mounts extends ReadonlyArray<Mount.LayeredMountDefinition> =
      readonly [],
    const Children extends ReadonlyArray<AnyBinding> = readonly [],
  >(
    config: Readonly<{
      mounts?: Mounts & Mount.PreciseMountRegistry<Mounts>
      children?: Children
    }> &
      ValidateChildBindings<
        Children,
        ModelSchema['Type'],
        MessageSchema['Type'],
        OutMessageSchema extends AnySchema ? OutMessageSchema['Type'] : never
      >,
  ): Composition<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  >
}

/**
 * Typed authoring helpers established before the optional child and Mount graph.
 * Features with no registered children or Mounts can assemble this value directly.
 */
export type Base<
  OwnerValue extends Owner<string>,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
> = Definition<
  OwnerValue,
  ModelSchema,
  MessageSchema,
  OutMessageSchema,
  readonly [],
  readonly []
> &
  Readonly<{
    register: Register<OwnerValue, ModelSchema, MessageSchema, OutMessageSchema>
  }>

/**
 * Establishes Model, Message and optional OutMessage contracts for Block authoring.
 */
export interface DefineBlock<OwnerValue extends Owner<string>> {
  <
    const ModelSchema extends AnySchema,
    const MessageSchema extends AnySchema,
    const OutMessageSchema extends AnySchema,
  >(
    config: Readonly<{
      Model: ModelSchema
      Message: MessageSchema
      OutMessage: OutMessageSchema
      mounts?: never
      children?: never
    }>,
  ): Base<OwnerValue, ModelSchema, MessageSchema, OutMessageSchema>
  <const ModelSchema extends AnySchema, const MessageSchema extends AnySchema>(
    config: Readonly<{
      Model: ModelSchema
      Message: MessageSchema
      OutMessage?: never
      mounts?: never
      children?: never
    }>,
  ): Base<OwnerValue, ModelSchema, MessageSchema, undefined>
}

const makeDefineView = <
  OwnerValue extends Owner<any>,
  Model,
  Message,
  RequiredMountRequirements,
>(
  owner: OwnerValue,
  children: ReadonlyArray<AnyBinding>,
): DefineView<OwnerValue, Model, Message, RequiredMountRequirements> => {
  function defineView(
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => Document,
  ): OwnedAuthoredView<
    DocumentView<Model, Message, RequiredMountRequirements>,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  >
  function defineView(
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null,
  ): OwnedAuthoredView<
    BlockView<Model, Message, void, RequiredMountRequirements>,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  >
  function defineView(
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null | Document,
  ):
    | OwnedAuthoredView<
        BlockView<Model, Message, void, RequiredMountRequirements>,
        OwnerValue,
        Model,
        Message,
        RequiredMountRequirements
      >
    | OwnedAuthoredView<
        DocumentView<Model, Message, RequiredMountRequirements>,
        OwnerValue,
        Model,
        Message,
        RequiredMountRequirements
      > {
    const ownedView = withViewIdentity(owner, children, view)
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    return defineHtmlView(ownedView as any) as
      | OwnedAuthoredView<
          BlockView<Model, Message, void, RequiredMountRequirements>,
          OwnerValue,
          Model,
          Message,
          RequiredMountRequirements
        >
      | OwnedAuthoredView<
          DocumentView<Model, Message, RequiredMountRequirements>,
          OwnerValue,
          Model,
          Message,
          RequiredMountRequirements
        >
  }

  const withInputs = <ViewInputs = never>(
    view: ViewWithInputs<Model, Message, ViewInputs, RequiredMountRequirements>,
  ): OwnedAuthoredView<
    BlockView<
      Model,
      Message,
      ValidViewInputs<ViewInputs>,
      RequiredMountRequirements
    >,
    OwnerValue,
    Model,
    Message,
    RequiredMountRequirements
  > => {
    const ownedView = withViewIdentity(owner, children, view)
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    return defineHtmlView(ownedView as any) as OwnedAuthoredView<
      BlockView<
        Model,
        Message,
        ValidViewInputs<ViewInputs>,
        RequiredMountRequirements
      >,
      OwnerValue,
      Model,
      Message,
      RequiredMountRequirements
    >
  }

  defineView.withInputs = withInputs

  return defineView
}

const makeDefineUpdate = <Model, Message, OutMessage>(): DefineUpdate<
  Model,
  Message,
  OutMessage
> => {
  function defineUpdate<
    const Context extends ReadonlyArray<unknown>,
    const Output extends OwnedReturn<Model, Message, OutMessage> &
      ValidateAnnotatedContext<Context>,
  >(
    update: (model: Model, message: Message, ...context: Context) => Output,
  ): DefinedUpdate<
    Model,
    Message,
    Context,
    OutMessageOfReturn<Output>,
    CommandRequirements<Output>,
    Update.RegistrationEvidenceOf<Output>
  >
  function defineUpdate(update: AnyFunction): AnyFunction {
    return update
  }

  return defineUpdate
}

const makeDefineStep = <Model, Message, OutMessage>(): DefineStep<
  Model,
  Message,
  OutMessage
> => {
  function defineStep<
    const Context extends ReadonlyArray<unknown>,
    const Output extends OwnedReturn<Model, Message, OutMessage> &
      ValidateAnnotatedContext<Context>,
  >(
    step: (model: Model, ...context: Context) => Output,
  ): DefinedStep<
    Model,
    Message,
    Context,
    OutMessageOfReturn<Output>,
    CommandRequirements<Output>,
    Update.RegistrationEvidenceOf<Output>
  >
  function defineStep(step: AnyFunction): AnyFunction {
    return step
  }

  return defineStep
}

const makeDefineSubscriptions = <Id extends string, Model, Message>(
  owner: Owner<Id>,
): DefineSubscriptions<Id, Model, Message> =>
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  ((build: AnyFunction) =>
    Subscription.make<Model, Message>()(entry => {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      const ownedEntry = ((
        name: string,
        fieldsOrConfig: unknown,
        maybeConfig?: unknown,
      ) => {
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
        const qualifiedName = makeOwnedName(owner.id, name as never)
        const definition =
          maybeConfig === undefined
            ? entry(
                qualifiedName,
                /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
                fieldsOrConfig as never,
              )
            : entry(
                qualifiedName,
                /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
                fieldsOrConfig as never,
                /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
                maybeConfig as never,
              )
        registerDefinition(owner, definition, name)
        return definition
      }) as never

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      return build(ownedEntry) as never
    })) as never

const makeDefineManagedResources =
  <Id extends string, Model, Message>(
    owner: Owner<Id>,
  ): DefineManagedResources<Id, Model, Message> =>
  build =>
    ManagedResource.make<Model, Message>()(entry => {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      const ownedEntry = ((
        name: string,
        schema: Schema.Schema<any>,
        config: unknown,
      ) => {
        const definition = entry(
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
          makeOwnedName(owner.id, name as never),
          schema,
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
          config as never,
        )
        registerDefinition(owner, definition, name)
        return definition
      }) as never

      return build(ownedEntry)
    })

const mergeMounts = (
  localMounts: ReadonlyArray<Mount.LayeredMountDefinition>,
  childMounts: ReadonlyArray<Mount.LayeredMountDefinition>,
): ReadonlyArray<Mount.LayeredMountDefinition> => {
  const seen = new Set<Mount.LayeredMountDefinition>()
  const mounts: Array<Mount.LayeredMountDefinition> = []

  for (const mount of [...localMounts, ...childMounts]) {
    if (!seen.has(mount)) {
      seen.add(mount)
      mounts.push(mount)
    }
  }

  return mounts
}

const assertDistinctManagedResourceOwners = (
  managedResources: Readonly<Record<string, unknown>>,
): void => {
  const owners = new Map<string, string>()

  for (const [registrationKey, entry] of globalThis.Object.entries(
    managedResources,
  )) {
    if (
      !Predicate.isObject(entry) ||
      !Predicate.hasProperty(entry, 'resource')
    ) {
      continue
    }

    const { resource } = entry
    if (
      !Predicate.isObject(resource) ||
      !Predicate.hasProperty(resource, 'key') ||
      !Predicate.isString(resource.key)
    ) {
      continue
    }

    const previous = owners.get(resource.key)
    if (previous !== undefined) {
      throw new Error(
        `[foldkit] Block ManagedResource registrations "${previous}" and "${registrationKey}" share the resource tag "${resource.key}". Bind each ManagedResource owner only once.`,
      )
    }

    owners.set(resource.key, registrationKey)
  }
}

// oxlint-disable effecttsgo/any-unknown-in-error-context
/**
 * @internal Runtime constructor behind {@link DefineBlock}.
 */
export const makeDefinition = (
  owner: Owner<any>,
  config: Readonly<{
    Model: AnySchema
    Message: AnySchema
    OutMessage?: AnySchema
    mounts?: ReadonlyArray<Mount.LayeredMountDefinition>
    children?: ReadonlyArray<AnyBinding>
  }>,
  authoring?: Readonly<{
    update: AnyFunction
    step: AnyFunction
    subscriptions: AnyFunction
    managedResources: AnyFunction
  }>,
): any => {
  const localMounts = config.mounts ?? []
  const children = config.children ?? []

  const childChannels = aggregateChildren(children)
  const mounts = mergeMounts(localMounts, childChannels.mounts)

  const defineView = makeDefineView(owner, children)
  const defineUpdate = authoring?.update ?? makeDefineUpdate()
  const defineStep = authoring?.step ?? makeDefineStep()
  const defineSubscriptions =
    authoring?.subscriptions ?? makeDefineSubscriptions(owner)
  const defineManagedResources =
    authoring?.managedResources ?? makeDefineManagedResources(owner)

  function assemble(
    implementation: {
      readonly view?: AnyAuthoredView
      readonly init: AnyFunction
      readonly update: AnyFunction
      readonly steps?: Readonly<Record<string, AnyFunction>>
      readonly subscriptions?: AnySubscriptions
      readonly managedResources?: AnyManagedResources
      readonly EffectsLayer?: AnyLayer
      readonly hostHandlers?: ReadonlyArray<unknown>
    },
    retainedHostIdentities?: ReadonlyArray<DefinitionIdentity>,
    areHostHandlersProvided = false,
  ): AnyBlock {
    const steps = implementation.steps ?? {}
    assertValidBindingStepNames(steps)
    const subscriptions = Subscription.aggregate(
      implementation.subscriptions ?? {},
      childChannels.subscriptions,
    )
    const managedResources = ManagedResource.aggregate(
      implementation.managedResources ?? {},
      childChannels.managedResources,
    )
    const hostIdentities =
      retainedHostIdentities ??
      (implementation.hostHandlers ?? []).map(definition => {
        if (
          definition === null ||
          (typeof definition !== 'object' && typeof definition !== 'function')
        ) {
          throw new Error(
            '[foldkit] Block hostHandlers entries must be Foldkit definitions.',
          )
        }

        const identity = identityOf(definition)
        if (identity === undefined) {
          throw new Error(
            '[foldkit] Block hostHandlers entries must be Layer-backed Foldkit definitions.',
          )
        }

        return identity
      })
    const localEffectsLayer = implementation.EffectsLayer ?? Layer.empty
    const selectedLayer = selectLayer(owner, localEffectsLayer, {
      allowedIdentities: hostIdentities,
      descendantOwners: descendantOwnersOf(children),
      ...(areHostHandlersProvided
        ? {
            requiredIdentities: new Set(
              hostIdentities.map(identity => identity.token),
            ),
          }
        : {}),
    })
    const EffectsLayer = Array.isReadonlyArrayEmpty(children)
      ? selectedLayer
      : Layer.merge(selectedLayer, childChannels.EffectsLayer)
    const hostHandlers = implementation.hostHandlers ?? []

    assertDistinctManagedResourceOwners(managedResources)

    function connection(bindingConfig: unknown): AnyBinding {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      return bindBlock(block, normalizeConnectionConfig(bindingConfig) as never)
    }

    function keyedConnection(bindingConfig: unknown): AnyBinding {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      return bindEachBlock(block, bindingConfig as never)
    }

    function replaceEffectsLayer(EffectsLayer: AnyLayer): AnyBlock {
      return assemble(
        { ...implementation, EffectsLayer },
        hostIdentities,
        areHostHandlersProvided,
      )
    }

    function provideHandlers(HandlersLayer: AnyLayer): AnyBlock {
      return assemble(
        {
          ...implementation,
          EffectsLayer: Layer.merge(localEffectsLayer, HandlersLayer),
          hostHandlers: [],
        },
        hostIdentities,
        true,
      )
    }

    const block = {
      owner,
      Model: config.Model,
      Message: config.Message,
      ...(config.OutMessage === undefined
        ? {}
        : { OutMessage: config.OutMessage }),
      view: defineView,
      mounts,
      [LocalMountsTypeId]: localMounts,
      children,
      init: implementation.init,
      update: implementation.update,
      steps,
      subscriptions,
      managedResources,
      EffectsLayer,
      hostHandlers,
      [LocalEffectsLayerTypeId]: localEffectsLayer,
      replaceEffectsLayer,
      provideHandlers,
      connection,
      keyedConnection,
    }

    registerDefaultView(block, implementation.view)
    localChannels.set(block, {
      subscriptions: implementation.subscriptions ?? {},
      managedResources: implementation.managedResources ?? {},
    })
    registerBlockHostIdentities(block, hostIdentities)

    return block
  }

  return {
    owner,
    Model: config.Model,
    Message: config.Message,
    ...(config.OutMessage === undefined
      ? {}
      : { OutMessage: config.OutMessage }),
    mounts,
    [LocalMountsTypeId]: localMounts,
    children,
    view: defineView,
    update: defineUpdate,
    step: defineStep,
    subscriptions: defineSubscriptions,
    managedResources: defineManagedResources,
    assemble,
  }
}
/** @internal Creates a typed definition before its composition graph. */
export const makeBaseDefinition = (
  owner: Owner<any>,
  config: Readonly<{
    Model: AnySchema
    Message: AnySchema
    OutMessage?: AnySchema
  }>,
): any => {
  const base = makeDefinition(owner, config)
  const register = (
    graph: Readonly<{
      mounts?: ReadonlyArray<Mount.LayeredMountDefinition>
      children?: ReadonlyArray<AnyBinding>
    }>,
  ) => {
    const composition = makeDefinition(owner, { ...config, ...graph }, base)

    return {
      owner: composition.owner,
      Model: composition.Model,
      Message: composition.Message,
      ...(composition.OutMessage === undefined
        ? {}
        : { OutMessage: composition.OutMessage }),
      mounts: composition.mounts,
      [LocalMountsTypeId]: composition[LocalMountsTypeId],
      children: composition.children,
      update: base.update,
      step: base.step,
      subscriptions: base.subscriptions,
      managedResources: base.managedResources,
      view: composition.view,
      assemble: composition.assemble,
    }
  }

  return { ...base, register }
}
// oxlint-enable effecttsgo/any-unknown-in-error-context
