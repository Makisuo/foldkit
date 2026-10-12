import { Layer, Option, Predicate } from 'effect'

import type { Command } from '../command/index.js'
import type { AnySubmodelView, SubmodelConfig } from '../html/submodel.js'
import * as ManagedResource from '../managedResource/index.js'
import type { LayeredMountDefinition } from '../mount/index.js'
import * as Subscription from '../subscription/subscription.js'
import * as Update from '../update/index.js'
import type { Owner } from './owner.js'

/**
 * @inline
 */
type AnyFunction = (...args: ReadonlyArray<any>) => any

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false

type AnyUpdateReturn = Readonly<{
  model: any
  commands?: ReadonlyArray<Command<any, never, any>>
  outMessage?: any
}>

type AnyProducer = (model: any, ...args: ReadonlyArray<any>) => AnyUpdateReturn

/** Structural portion of a complete descriptor needed to create a binding.
 * It deliberately omits the descriptor's own `bind` method, avoiding a
 * recursive constraint while preserving every channel collected by parents. */
export type BindableDescriptor = Readonly<{
  owner: Owner<any>
  Model: Readonly<{ Type: any }>
  Message: Readonly<{ Type: any }>
  OutMessage?: Readonly<{ Type: any }>
  mounts: ReadonlyArray<LayeredMountDefinition>
  children: ReadonlyArray<AnyBinding>
  view?: AnySubmodelView
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
  hostHandlers: ReadonlyArray<unknown>
}>

type DescriptorUpdate<Definition extends Readonly<{ update: AnyFunction }>> =
  Definition['update']

type DescriptorModel<Definition extends BindableDescriptor> = Parameters<
  DescriptorUpdate<Definition>
>[0]

type DescriptorMessage<
  Definition extends Readonly<{ Message: Readonly<{ Type: any }> }>,
> = Definition['Message']['Type']

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
        context: Update.FoldContext<ChildMessage, ParentMessage>,
      ) => (
        model: ParentModel,
      ) => Update.ReturnWithOutMessage<ParentModel, any, any, any>
      forward?: never
    }>
  | Readonly<{
      forward: (outMessage: ChildOutMessage) => unknown | undefined
      fold?: (
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage>,
      ) => (
        model: ParentModel,
      ) => Update.ReturnWithOutMessage<ParentModel, any, any, any>
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

type SubscriptionWhen<Definition extends BindableDescriptor, ParentModel> =
  | ((model: ParentModel) => boolean)
  | Readonly<
      Partial<
        Record<
          keyof Definition['subscriptions'],
          (model: ParentModel) => boolean
        >
      >
    >

type BindingBaseConfig<
  Definition extends BindableDescriptor,
  ParentModel,
  ParentMessage,
  Placement extends string,
> = Readonly<{
  placement: Placement
  read: (model: ParentModel) => Option.Option<DescriptorModel<Definition>>
  write: (
    model: ParentModel,
    nextChildModel: DescriptorModel<Definition>,
  ) => ParentModel
  toParentMessage: (message: DescriptorMessage<Definition>) => ParentMessage
  subscriptions?: Readonly<{
    when?: SubscriptionWhen<Definition, ParentModel>
  }>
}>

/** The one-time placement and parent policy used to bind a complete Submodel
 * descriptor into a parent Model and Message context. Subscription gates are
 * lifecycle policy only; they never change whether the update fold can read
 * the child. */
export type BindingConfig<
  Definition extends Readonly<{
    Model: Readonly<{ Type: any }>
    Message: Readonly<{ Type: any }>
    subscriptions: Readonly<Record<string, unknown>>
  }>,
  ParentModel,
  ParentMessage,
  Placement extends string,
  Policy = never,
> = Readonly<{
  placement: Placement
  read: (model: ParentModel) => Option.Option<Definition['Model']['Type']>
  write: (
    model: ParentModel,
    nextChildModel: Definition['Model']['Type'],
  ) => ParentModel
  toParentMessage: (message: Definition['Message']['Type']) => ParentMessage
  subscriptions?: Readonly<{
    when?:
      | ((model: ParentModel) => boolean)
      | Readonly<
          Partial<
            Record<
              keyof Definition['subscriptions'],
              (model: ParentModel) => boolean
            >
          >
        >
  }>
}> &
  (Definition extends Readonly<{
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
> = [
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
      Update.RequirementsOf<ChildProducer>
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
            forward: (...args: ReadonlyArray<any>) => infer ForwardedOutMessage
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
              | Update.RequirementsOf<ChildProducer>
              | Update.RequirementsOf<() => PolicyReturn>
            >
          : Update.ReturnWithOutMessage<
              ParentModel,
              | ParentMessage
              | (PolicyCommand extends Command<infer CommandMessage, any, any>
                  ? CommandMessage
                  : never),
              ParentOutMessage,
              | Update.RequirementsOf<ChildProducer>
              | Update.RequirementsOf<() => PolicyReturn>
            >
        : never
      : never
    : never

type Namespaced<Placement extends string, Entries> = {
  readonly [
    Key in keyof Entries as Key extends string ? `${Placement}/${Key}` : never
  ]: Entries[Key]
}

const liftSubscriptions = <
  Definition extends BindableDescriptor,
  ParentModel,
  ParentMessage,
>(
  definition: Definition,
  config: Readonly<{
    read: (model: ParentModel) => Option.Option<DescriptorModel<Definition>>
    toParentMessage: (message: DescriptorMessage<Definition>) => ParentMessage
    when?: SubscriptionWhen<Definition, ParentModel>
  }>,
) =>
  Subscription.lift(definition.subscriptions)<ParentModel, ParentMessage>(
    config,
  )

const liftManagedResources = <
  Definition extends BindableDescriptor,
  ParentModel,
  ParentMessage,
>(
  definition: Definition,
  config: Readonly<{
    read: (model: ParentModel) => Option.Option<DescriptorModel<Definition>>
    toParentMessage: (message: DescriptorMessage<Definition>) => ParentMessage
  }>,
) =>
  ManagedResource.lift(definition.managedResources)<ParentModel, ParentMessage>(
    config,
  )

/**
 * A complete static Submodel placement lowered into its parent context.
 */
export type Binding<
  Definition extends Readonly<{
    Model: Readonly<{ Type: any }>
    Message: Readonly<{ Type: any }>
    OutMessage?: Readonly<{ Type: any }>
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
    view?: AnySubmodelView
  }>,
  ParentModel,
  ParentMessage,
  Placement extends string,
  Policy,
> = Readonly<{
  /**
   * @internal Retains exact descriptor evidence without a runtime field.
   */
  [BindingDefinitionTypeId]: Definition
  placement: Placement
  fold: (
    model: ParentModel,
    ...args: [
      message: Definition['Message']['Type'],
      ...context: Parameters<Definition['update']> extends readonly [
        unknown,
        unknown,
        ...infer Context,
      ]
        ? Context
        : readonly [],
    ]
  ) => BindingReturn<ParentModel, ParentMessage, Definition['update'], Policy>
  /**
   * Defers the descriptor's primary update as a parent Step.
   */
  step: (
    ...args: [
      message: Definition['Message']['Type'],
      ...context: Parameters<Definition['update']> extends readonly [
        unknown,
        unknown,
        ...infer Context,
      ]
        ? Context
        : readonly [],
    ]
  ) => (
    model: ParentModel,
  ) => BindingReturn<ParentModel, ParentMessage, Definition['update'], Policy>
  steps: {
    readonly [
      Key in keyof Definition['steps']
    ]: Definition['steps'][Key] extends (...args: ReadonlyArray<any>) => any
      ? (
          ...args: Parameters<Definition['steps'][Key]> extends readonly [
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
          Definition['steps'][Key],
          Policy
        >
      : never
  }
  subscriptions: {
    readonly [
      Key in keyof Definition['subscriptions']
    ]: Definition['subscriptions'][Key] extends Subscription.Subscription<
      any,
      any,
      infer Dependencies,
      infer Services
    >
      ? Subscription.Subscription<
          ParentModel,
          ParentMessage,
          Subscription.GatedDependencies<Dependencies>,
          Services
        > &
          (Definition['subscriptions'][Key] extends Readonly<{
            messages: infer Messages
          }>
            ? Readonly<{ messages: Messages }>
            : unknown) &
          (Definition['subscriptions'][Key] extends Readonly<{
            name: infer Name
            toLayer: infer ToLayer
          }>
            ? Readonly<{ name: Name; toLayer: ToLayer }>
            : unknown) &
          (Definition['subscriptions'][Key] extends Readonly<{
            layer: infer EntryLayer
          }>
            ? Readonly<{ layer: EntryLayer }>
            : unknown)
      : never
  }
  managedResources: {
    readonly [
      Key in keyof Definition['managedResources']
    ]: Definition['managedResources'][Key] extends ManagedResource.Entry<
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
          Service,
          (...args: Parameters<OnAcquired>) => ParentMessage,
          LifecycleServices,
          Params
        > &
          (Definition['managedResources'][Key] extends Readonly<{
            name: infer Name
            toLayer: infer ToLayer
          }>
            ? Readonly<{ name: Name; toLayer: ToLayer }>
            : unknown) &
          (Definition['managedResources'][Key] extends Readonly<{
            layer: infer EntryLayer
          }>
            ? Readonly<{ layer: EntryLayer }>
            : unknown)
      : never
  }
  mounts: Definition['mounts']
  EffectsLayer: Definition['EffectsLayer']
  embed: Definition extends Readonly<{
    view: infer CanonicalView extends AnySubmodelView
  }>
    ? {
        <View extends AnySubmodelView>(
          config: Omit<SubmodelConfig<View, ParentMessage>, 'toParentMessage'> &
            ([Parameters<View>[0], Definition['Model']['Type']] extends [
              Definition['Model']['Type'],
              Parameters<View>[0],
            ]
              ? [
                  Parameters<
                    SubmodelConfig<View, ParentMessage>['toParentMessage']
                  >[0],
                  Definition['Message']['Type'],
                ] extends [
                  Definition['Message']['Type'],
                  Parameters<
                    SubmodelConfig<View, ParentMessage>['toParentMessage']
                  >[0],
                ]
                ? unknown
                : never
              : never),
        ): SubmodelConfig<View, ParentMessage>
        (
          config: Omit<
            SubmodelConfig<CanonicalView, ParentMessage>,
            'toParentMessage' | 'view'
          > &
            Readonly<{ view?: CanonicalView }>,
        ): SubmodelConfig<CanonicalView, ParentMessage>
      }
    : <View extends AnySubmodelView>(
        config: Omit<SubmodelConfig<View, ParentMessage>, 'toParentMessage'> &
          ([Parameters<View>[0], Definition['Model']['Type']] extends [
            Definition['Model']['Type'],
            Parameters<View>[0],
          ]
            ? [
                Parameters<
                  SubmodelConfig<View, ParentMessage>['toParentMessage']
                >[0],
                Definition['Message']['Type'],
              ] extends [
                Definition['Message']['Type'],
                Parameters<
                  SubmodelConfig<View, ParentMessage>['toParentMessage']
                >[0],
              ]
              ? unknown
              : never
            : never),
      ) => SubmodelConfig<View, ParentMessage>
}>

/** The `Home.bind({...})` method of a complete Submodel descriptor. Parent
 * types are inferred from the placement accessors and Message lift. */
export type Bind<
  Definition extends Readonly<{
    Model: Readonly<{ Type: any }>
    Message: Readonly<{ Type: any }>
    OutMessage?: Readonly<{ Type: any }>
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
    view?: AnySubmodelView
  }>,
> =
  Definition extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
  }>
    ? <
        ParentModel,
        ParentMessage,
        const Placement extends string,
        const Policy extends OutMessagePolicy<
          ParentModel,
          Definition['Message']['Type'],
          ParentMessage,
          ChildOutMessage
        >,
      >(
        config: BindingConfig<
          Definition,
          ParentModel,
          ParentMessage,
          Placement,
          Policy
        >,
      ) => Binding<Definition, ParentModel, ParentMessage, Placement, Policy>
    : <ParentModel, ParentMessage, const Placement extends string>(
        config: BindingConfig<
          Definition,
          ParentModel,
          ParentMessage,
          Placement
        >,
      ) => Binding<Definition, ParentModel, ParentMessage, Placement, never>

/** Structural bound for a child binding stored by a parent descriptor.
 * @inline */
export type AnyBinding = Readonly<{
  /**
   * @internal Retains exact descriptor evidence without a runtime field.
   */
  [BindingDefinitionTypeId]: BindableDescriptor
  placement: string
  fold: AnyFunction
  step: AnyFunction
  steps: Readonly<Record<string, AnyFunction>>
  subscriptions: BindableDescriptor['subscriptions']
  managedResources: BindableDescriptor['managedResources']
  mounts: ReadonlyArray<LayeredMountDefinition>
  EffectsLayer: Layer.Any
  embed: AnyFunction
}>

/**
 * @internal Type-only key for a binding's retained descriptor evidence.
 */
export declare const BindingDefinitionTypeId: unique symbol

/**
 * @internal Structural descriptor evidence used by type-level fixtures.
 */
export type BindingDefinitionEvidence<Definition> = Readonly<{
  [BindingDefinitionTypeId]: Definition
}>

/**
 * @internal Recovers the descriptor type retained by a binding.
 */
export type DefinitionOfBinding<BindingValue> =
  BindingValue extends Readonly<{
    [BindingDefinitionTypeId]: infer Definition
  }>
    ? Definition
    : never

const bindingDefinitions = new WeakMap<AnyBinding, BindableDescriptor>()

/**
 * @internal Returns the descriptor retained by a binding.
 */
export const definitionOf = (binding: AnyBinding): BindableDescriptor => {
  const definition = bindingDefinitions.get(binding)
  if (definition === undefined) {
    throw new Error(
      "[foldkit] Submodel binding metadata is unavailable. Create bindings through a composed descriptor's bind method.",
    )
  }

  return definition
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

const makeFold = (
  producer: AnyProducer,
  config: RuntimeBindingConfig,
): AnyFunction => {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const makeChildFold = Update.foldChild as unknown as (
    childFold: ReturnType<typeof toChildFold>,
  ) => AnyFunction
  const fold = makeChildFold(toChildFold(producer, config))

  return (model: any, ...args: ReadonlyArray<any>) => fold(model, args)
}

const makeDeferredStep = (
  producer: AnyProducer,
  config: RuntimeBindingConfig,
): AnyFunction => {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const makeChildFold = Update.foldChild as unknown as (
    childFold: ReturnType<typeof toChildFold>,
  ) => AnyFunction
  const fold = makeChildFold(toChildFold(producer, config))
  return (...args: ReadonlyArray<any>) => fold(args)
}

const makeSteps = (
  steps: Readonly<Record<string, AnyProducer>>,
  config: RuntimeBindingConfig,
): Readonly<Record<string, AnyFunction>> => {
  const boundSteps: Record<string, AnyFunction> = {}

  for (const [name, step] of Object.entries(steps)) {
    boundSteps[name] = makeDeferredStep(step, config)
  }

  return boundSteps
}

const bindRuntime = <
  const Definition extends BindableDescriptor,
  ParentModel,
  ParentMessage,
  const Placement extends string,
  const Policy = never,
>(
  definition: Definition,
  config: BindingConfig<
    Definition,
    ParentModel,
    ParentMessage,
    Placement,
    Policy
  >,
): Binding<Definition, ParentModel, ParentMessage, Placement, Policy> => {
  const runtimeConfig: RuntimeBindingConfig = config
  const liftedSubscriptions = liftSubscriptions(definition, {
    read: config.read,
    toParentMessage: config.toParentMessage,
    ...(config.subscriptions?.when === undefined
      ? {}
      : { when: config.subscriptions.when }),
  })
  const liftedManagedResources = liftManagedResources(definition, {
    read: config.read,
    toParentMessage: config.toParentMessage,
  })
  const embed = <View extends AnySubmodelView>(
    embedConfig: Omit<
      SubmodelConfig<View, ParentMessage>,
      'toParentMessage' | 'view'
    > &
      Readonly<{ view?: View }>,
  ): SubmodelConfig<View, ParentMessage> =>
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ({
      ...embedConfig,
      view: embedConfig.view ?? definition.view,
      toParentMessage: config.toParentMessage,
    }) as unknown as SubmodelConfig<View, ParentMessage>

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const binding = {
    placement: config.placement,
    fold: makeFold(definition.update, runtimeConfig),
    step: makeDeferredStep(definition.update, runtimeConfig),
    steps: makeSteps(definition.steps, runtimeConfig),
    subscriptions: liftedSubscriptions,
    managedResources: liftedManagedResources,
    mounts: definition.mounts,
    EffectsLayer: definition.EffectsLayer,
    embed,
  } as unknown as Binding<
    Definition,
    ParentModel,
    ParentMessage,
    Placement,
    Policy
  >

  bindingDefinitions.set(binding, definition)

  return binding
}

type BindDescriptor = {
  <
    const Definition extends BindableDescriptor &
      Readonly<{ OutMessage: Readonly<{ Type: any }> }>,
    ParentModel,
    ParentMessage,
    const Placement extends string,
    const Policy extends OutMessagePolicy<
      ParentModel,
      DescriptorMessage<Definition>,
      ParentMessage,
      Definition['OutMessage']['Type']
    >,
  >(
    definition: Definition,
    config: BindingBaseConfig<
      Definition,
      ParentModel,
      ParentMessage,
      Placement
    > &
      Readonly<{ outMessage: Policy }> &
      ValidateForwardPolicy<Policy>,
  ): Binding<Definition, ParentModel, ParentMessage, Placement, Policy>
  <
    const Definition extends BindableDescriptor &
      Readonly<{ OutMessage?: never }>,
    ParentModel,
    ParentMessage,
    const Placement extends string,
  >(
    definition: Definition,
    config: BindingBaseConfig<
      Definition,
      ParentModel,
      ParentMessage,
      Placement
    > &
      Readonly<{ outMessage?: never }>,
  ): Binding<Definition, ParentModel, ParentMessage, Placement, never>
  (definition: BindableDescriptor, config: never): AnyBinding
}

/** Binds a complete child descriptor to one static or optional state
 * placement. Update, registered Steps, Subscriptions, and ManagedResources use
 * its placement accessors. Lifecycle and view Messages use its parent lift.
 * Parent init ordering remains explicit. */
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
export const bind: BindDescriptor = bindRuntime as unknown as BindDescriptor

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

/** The lifecycle registrations and handler recipe contributed by a descriptor's
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
          `Submodel.aggregateChildren: duplicate ${kind} registration key "${registrationKey}"`,
        )
      }

      entries[registrationKey] = entry
    }
  }

  return entries
}

const assertDistinctManagedResourceOwners = (
  children: ReadonlyArray<AnyBinding>,
): void => {
  const owners = new Map<string, string>()

  for (const child of children) {
    for (const entry of Object.values(child.managedResources)) {
      if (!Predicate.isObject(entry)) {
        continue
      }

      const { resource } = entry
      if (
        !Predicate.isObject(resource) ||
        !Predicate.isString(resource['key'])
      ) {
        continue
      }

      const resourceKey = resource['key']
      const previousPlacement = owners.get(resourceKey)
      if (previousPlacement !== undefined) {
        throw new Error(
          `Submodel.aggregateChildren: bindings "${previousPlacement}" and "${child.placement}" register the same ManagedResource tag key "${resourceKey}". Give each lifecycle owner a distinct ManagedResource tag.`,
        )
      }

      owners.set(resourceKey, child.placement)
    }
  }
}

/** Aggregates the complete static registrations of bound children. It qualifies
 * collected record keys by placement while each binding keeps readable local
 * keys for direct access. Repeated Mount definitions are shared, as is one
 * descriptor's handler recipe across multiple placements. Reusing a
 * ManagedResource owner fails because a record-key prefix cannot create a new
 * resource service identity or value slot. */
export const aggregateChildren = <
  const Children extends ReadonlyArray<AnyBinding>,
>(
  children: Children,
): AggregatedChildren<Children> => {
  assertDistinctManagedResourceOwners(children)

  const subscriptions = mergeChildRecords('Subscription', children)
  const managedResources = mergeChildRecords('ManagedResource', children)
  const mounts: Array<LayeredMountDefinition> = []
  const seenMounts = new Set<LayeredMountDefinition>()
  const layers: Array<Layer.Any> = []
  const seenDefinitions = new Set<BindableDescriptor>()

  for (const child of children) {
    for (const mount of child.mounts) {
      if (!seenMounts.has(mount)) {
        seenMounts.add(mount)
        mounts.push(mount)
      }
    }

    const definition = definitionOf(child)
    if (!seenDefinitions.has(definition)) {
      seenDefinitions.add(definition)
      layers.push(child.EffectsLayer)
    }
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
