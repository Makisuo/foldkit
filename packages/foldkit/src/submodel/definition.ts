import { Array, Layer, Predicate, type Schema } from 'effect'

import type { Command } from '../command/index.js'
import {
  type AnySubmodelView,
  type HtmlBuilder,
  type SubmodelView,
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
  aggregateChildren,
  bind as bindDescriptor,
  definitionOf,
} from './binding.js'
import type { Owner } from './owner.js'
import type { ValidateComposition } from './requirements.js'

type AnySchema = Schema.Codec<any, any, any, any>
type AnyFunction = (...args: ReadonlyArray<any>) => any
type AnyLayer = Layer.Layer<never, any, any> | Layer.Layer<any, any, any>
type EmptyRecord = Readonly<Record<never, never>>
type AnySubscriptions = Subscription.Subscriptions<any, any, any>
type AnyManagedResources = Readonly<
  Record<string, ManagedResource.Entry<any, any, any, any, any, any, any, any>>
>

const OwnerEffectsLayerTypeId = Symbol('foldkit/Submodel/OwnerEffectsLayer')

type SchemaType<Value> = Value extends AnySchema ? Value['Type'] : never

type OutMessageType<OutMessageSchema> = OutMessageSchema extends AnySchema
  ? OutMessageSchema['Type']
  : never

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

type OwnedReturn<Model, Message, OutMessage> = Update.ReturnWithOutMessage<
  Model,
  Message,
  OutMessage,
  any
>

type UpdateContext<UpdateFunction extends AnyFunction> =
  Parameters<UpdateFunction> extends readonly [
    unknown,
    unknown,
    ...infer Context,
  ]
    ? Context
    : readonly []

type StepContext<Step extends AnyFunction> =
  Parameters<Step> extends readonly [unknown, ...infer Context]
    ? Context
    : readonly []

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
        'Submodel context parameters cannot use any': Context
      }>
    : unknown

type DefinedUpdate<UpdateFunction extends AnyFunction, Model, Message> = (
  model: Model,
  message: Message,
  ...context: UpdateContext<UpdateFunction>
) => [OutMessageOfReturn<ReturnType<UpdateFunction>>] extends [never]
  ? Update.Return<
      Model,
      Message,
      CommandRequirements<ReturnType<UpdateFunction>>
    >
  : Update.ReturnWithOutMessage<
      Model,
      Message,
      OutMessageOfReturn<ReturnType<UpdateFunction>>,
      CommandRequirements<ReturnType<UpdateFunction>>
    >

type DefinedStep<Step extends AnyFunction, Model, Message> = (
  model: Model,
  ...context: StepContext<Step>
) => [OutMessageOfReturn<ReturnType<Step>>] extends [never]
  ? Update.Return<Model, Message, CommandRequirements<ReturnType<Step>>>
  : Update.ReturnWithOutMessage<
      Model,
      Message,
      OutMessageOfReturn<ReturnType<Step>>,
      CommandRequirements<ReturnType<Step>>
    >

/**
 * Defines a view against one Submodel's Model, Message, and Mount registry.
 */
export interface DefineView<Model, Message, RequiredMountRequirements> {
  (
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null,
  ): SubmodelView<Model, Message, void, RequiredMountRequirements>
  readonly withInputs: <ViewInputs = never>(
    view: [ValidViewInputs<ViewInputs>] extends [never]
      ? never
      : (
          model: Model,
          viewInputs: NoInfer<ValidViewInputs<ViewInputs>>,
          h: HtmlBuilder<Message, RequiredMountRequirements>,
        ) => VNode | null,
  ) => SubmodelView<
    Model,
    Message,
    ValidViewInputs<ViewInputs>,
    RequiredMountRequirements
  >
}

/**
 * Defines the primary update function of an owned Submodel.
 */
export interface DefineUpdate<Model, Message, OutMessage> {
  <
    const Context extends ReadonlyArray<unknown>,
    const Output extends Update.ReturnWithOutMessage<
      Model,
      Message,
      OutMessage,
      any
    > &
      ValidateAnnotatedContext<Context>,
  >(
    update: (model: Model, message: Message, ...context: Context) => Output,
  ): DefinedUpdate<
    (model: Model, message: Message, ...context: Context) => Output,
    Model,
    Message
  >
}

/**
 * Defines a named public Step of an owned Submodel.
 */
export interface DefineStep<Model, Message, OutMessage> {
  <
    const Context extends ReadonlyArray<unknown>,
    const Output extends Update.ReturnWithOutMessage<
      Model,
      Message,
      OutMessage,
      any
    > &
      ValidateAnnotatedContext<Context>,
  >(
    step: (model: Model, ...context: Context) => Output,
  ): DefinedStep<(model: Model, ...context: Context) => Output, Model, Message>
}

type BindingParentModel<Binding> =
  Binding extends Readonly<{
    fold: infer Fold extends AnyFunction
  }>
    ? Parameters<Fold>[0]
    : never

type StepFactoryOutput<Factory> = Factory extends AnyFunction
  ? ReturnType<Factory> extends infer Step extends AnyFunction
    ? ReturnType<Step>
    : never
  : never

type BindingOutputs<Binding> =
  Binding extends Readonly<{
    fold: infer Fold extends AnyFunction
    step: infer Step extends AnyFunction
    steps: infer Steps extends Readonly<Record<string, AnyFunction>>
  }>
    ? ReturnType<Fold> | StepFactoryOutput<Step | Steps[keyof Steps]>
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

type ValidateChildBindings<
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
      'Submodel child bindings must match the parent Model, Message, and OutMessage':
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

type OutMessageSchemaField<OutMessageSchema> =
  OutMessageSchema extends AnySchema
    ? Readonly<{ OutMessage: OutMessageSchema }>
    : Readonly<{ OutMessage?: never }>

type CompositionView<Composition> =
  Composition extends Readonly<{ view: infer View extends AnySubmodelView }>
    ? View
    : undefined

type CompositionSteps<Composition> =
  Composition extends Readonly<{ steps: infer Steps }> ? Steps : EmptyRecord

type CompositionSubscriptions<Composition> =
  Composition extends Readonly<{ subscriptions: infer Subscriptions }>
    ? Subscriptions
    : EmptyRecord

type CompositionManagedResources<Composition> =
  Composition extends Readonly<{ managedResources: infer ManagedResources }>
    ? ManagedResources
    : EmptyRecord

type CompositionHostHandlers<Composition> =
  Composition extends Readonly<{ hostHandlers: infer HostHandlers }>
    ? HostHandlers
    : readonly []

/**
 * The implementation channels supplied to an owned Submodel's `compose`
 * method. The descriptor retains the exact types of the supplied functions,
 * registrations, and local Layer recipe. Check an implementation with
 * `satisfies Composition<Model, Message, OutMessage>` to retain its inferred
 * service requirements; annotating it with this broad type erases them.
 */
export type Composition<Model, Message, OutMessage = never> = Readonly<{
  view?: AnySubmodelView
  init(
    ...args: ReadonlyArray<unknown>
  ): Update.ReturnWithOutMessage<Model, Message, OutMessage, any>
  update(
    model: Model,
    message: Message,
    ...context: ReadonlyArray<unknown>
  ): Update.ReturnWithOutMessage<Model, Message, OutMessage, any>
  steps?: Readonly<
    Record<
      string,
      {
        step(
          model: Model,
          ...context: ReadonlyArray<unknown>
        ): Update.ReturnWithOutMessage<Model, Message, OutMessage, any>
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

type ExactCompositionKeys<Implementation> = Readonly<{
  [
    Key in Exclude<keyof Implementation, keyof Composition<any, any, any>>
  ]: never
}>

type ValidateView<Composition, Model, Message, AllowedMountRequirements> =
  CompositionView<Composition> extends infer View
    ? View extends AnySubmodelView
      ? View extends SubmodelView<
          Model,
          Message,
          infer _ViewInputs,
          infer RequiredMountRequirements
        >
        ? [
            Exclude<RequiredMountRequirements, AllowedMountRequirements>,
          ] extends [never]
          ? unknown
          : Readonly<{
              'Submodel view requires Mounts absent from its definition': Exclude<
                RequiredMountRequirements,
                AllowedMountRequirements
              >
            }>
        : Readonly<{
            'Submodel view must use the definition Model and Message': View
          }>
      : unknown
    : unknown

type CompositionForValidation<
  OwnerValue,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  Implementation extends Composition<
    SchemaType<ModelSchema>,
    SchemaType<MessageSchema>,
    OutMessageType<OutMessageSchema>
  >,
> = Readonly<{
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: Mounts
  children: Children
  init: Implementation['init']
  update: Implementation['update']
  steps: CompositionSteps<Implementation>
  subscriptions: CompositionSubscriptions<Implementation>
  managedResources: CompositionManagedResources<Implementation>
  EffectsLayer: CompleteEffectsLayer<Implementation['EffectsLayer'], Children>
  hostHandlers: CompositionHostHandlers<Implementation>
}> &
  OutMessageSchemaField<OutMessageSchema>

/**
 * The passive contract produced after a Submodel definition is composed.
 * It carries every lifecycle registration, Layer recipe, public Step, and
 * child binding needed to install the Submodel in a parent.
 */
export type Descriptor<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
  Implementation extends Pick<
    Composition<
      ModelSchema['Type'],
      MessageSchema['Type'],
      OutMessageSchema extends Schema.Codec<any, any, any, any>
        ? OutMessageSchema['Type']
        : never
    >,
    'init' | 'update' | 'EffectsLayer'
  >,
> = Readonly<{
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: readonly [
    ...Mounts,
    ...ReadonlyArray<Children[number]['mounts'][number]>,
  ]
  children: Children
  init: Implementation['init']
  update: Implementation['update']
  steps: Implementation extends Readonly<{
    steps: infer Steps extends Readonly<
      Record<string, (...args: ReadonlyArray<any>) => any>
    >
  }>
    ? Steps
    : Readonly<Record<never, never>>
  subscriptions: (Implementation extends Readonly<{
    subscriptions: infer Subscriptions extends Subscription.Subscriptions<
      any,
      any,
      any
    >
  }>
    ? Subscriptions
    : Readonly<Record<never, never>>) &
    AggregatedChildren<Children>['subscriptions']
  managedResources: (Implementation extends Readonly<{
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
      Implementation['EffectsLayer'] | Children[number]['EffectsLayer']
    >,
    Layer.Error<
      Implementation['EffectsLayer'] | Children[number]['EffectsLayer']
    >,
    Layer.Services<
      Implementation['EffectsLayer'] | Children[number]['EffectsLayer']
    >
  >
  hostHandlers: Implementation extends Readonly<{
    hostHandlers: infer HostHandlers extends ReadonlyArray<unknown>
  }>
    ? HostHandlers
    : readonly []
}> &
  (OutMessageSchema extends Schema.Codec<any, any, any, any>
    ? Readonly<{ OutMessage: OutMessageSchema }>
    : Readonly<{ OutMessage?: never }>) &
  (Implementation extends Readonly<{ view: infer View extends AnySubmodelView }>
    ? Readonly<{ view: View }>
    : Readonly<{ view?: never }>) &
  Readonly<{
    /**
     * Selects a replacement local Layer recipe and retains the selected child
     * graph. The returned descriptor keeps the Owner, operations, lifecycle
     * registrations, and host handler contract. Selection builds no services
     * and never constructs the previous local recipe.
     */
    withEffectsLayer: <
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
          Descriptor<
            OwnerValue,
            ModelSchema,
            MessageSchema,
            OutMessageSchema,
            Mounts,
            Children,
            Readonly<{
              [Key in keyof Implementation]: Key extends 'EffectsLayer'
                ? SelectedEffectsLayer
                : Implementation[Key]
            }>
          >
        >,
    ) => Descriptor<
      OwnerValue,
      ModelSchema,
      MessageSchema,
      OutMessageSchema,
      Mounts,
      Children,
      Readonly<{
        [Key in keyof Implementation]: Key extends 'EffectsLayer'
          ? SelectedEffectsLayer
          : Implementation[Key]
      }>
    >
    bind: Bind<
      Descriptor<
        OwnerValue,
        ModelSchema,
        MessageSchema,
        OutMessageSchema,
        Mounts,
        Children,
        Implementation
      >
    >
  }>

/**
 * Structural bound for any composed Submodel descriptor.
 */
export type AnyDescriptor = Readonly<{
  owner: Owner<any>
  Model: AnySchema
  Message: AnySchema
  mounts: ReadonlyArray<Mount.LayeredMountDefinition>
  children: ReadonlyArray<AnyBinding>
  init: AnyFunction
  update: AnyFunction
  steps: Readonly<Record<string, AnyFunction>>
  subscriptions: AnySubscriptions
  managedResources: AnyManagedResources
  EffectsLayer: AnyLayer
  hostHandlers: ReadonlyArray<unknown>
  view?: AnySubmodelView
  OutMessage?: AnySchema
  withEffectsLayer: AnyFunction
  bind: AnyFunction
}>

/**
 * Completes an owned Submodel definition with its implementation channels.
 */
export interface ComposeSubmodel<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> {
  <
    const Implementation extends Composition<
      ModelSchema['Type'],
      MessageSchema['Type'],
      OutMessageSchema extends Schema.Codec<any, any, any, any>
        ? OutMessageSchema['Type']
        : never
    >,
  >(
    composition: Implementation &
      ExactCompositionKeys<Implementation> &
      ValidateView<
        Implementation,
        ModelSchema['Type'],
        MessageSchema['Type'],
        Mount.RequirementsOf<
          readonly [
            ...Mounts,
            ...ReadonlyArray<Children[number]['mounts'][number]>,
          ]
        >
      > &
      ValidateComposition<
        Definition<
          OwnerValue,
          ModelSchema,
          MessageSchema,
          OutMessageSchema,
          Mounts,
          Children
        >,
        CompositionForValidation<
          OwnerValue,
          ModelSchema,
          MessageSchema,
          OutMessageSchema,
          Mounts,
          Children,
          Implementation
        >
      >,
  ): Descriptor<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children,
    Implementation
  >
}

/**
 * The authoring contract created by `owner.define`.
 */
export type Definition<
  OwnerValue extends Owner<string>,
  ModelSchema extends Schema.Codec<any, any, any, any>,
  MessageSchema extends Schema.Codec<any, any, any, any>,
  OutMessageSchema extends Schema.Codec<any, any, any, any> | undefined,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  owner: OwnerValue
  Model: ModelSchema
  Message: MessageSchema
  mounts: readonly [
    ...Mounts,
    ...ReadonlyArray<Children[number]['mounts'][number]>,
  ]
  children: Children
  defineView: DefineView<
    ModelSchema['Type'],
    MessageSchema['Type'],
    Mount.RequirementsOf<
      readonly [...Mounts, ...ReadonlyArray<Children[number]['mounts'][number]>]
    >
  >
  defineUpdate: DefineUpdate<
    ModelSchema['Type'],
    MessageSchema['Type'],
    OutMessageSchema extends Schema.Codec<any, any, any, any>
      ? OutMessageSchema['Type']
      : never
  >
  defineStep: DefineStep<
    ModelSchema['Type'],
    MessageSchema['Type'],
    OutMessageSchema extends Schema.Codec<any, any, any, any>
      ? OutMessageSchema['Type']
      : never
  >
  compose: ComposeSubmodel<
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
 * Defines the Model, Message, OutMessage, Mount, and child contracts owned by a Submodel.
 */
export interface DefineOwnedSubmodel<OwnerValue extends Owner<string>> {
  <
    const ModelSchema extends Schema.Codec<any, any, any, any>,
    const MessageSchema extends Schema.Codec<any, any, any, any>,
    const OutMessageSchema extends Schema.Codec<any, any, any, any>,
    const Mounts extends ReadonlyArray<Mount.LayeredMountDefinition> =
      readonly [],
    const Children extends ReadonlyArray<AnyBinding> = readonly [],
  >(
    config: Readonly<{
      Model: ModelSchema
      Message: MessageSchema
      OutMessage: OutMessageSchema
      mounts?: Mounts & Mount.PreciseMountRegistry<Mounts>
      children?: Children
    }> &
      ValidateChildBindings<
        Children,
        ModelSchema['Type'],
        MessageSchema['Type'],
        OutMessageSchema extends Schema.Codec<any, any, any, any>
          ? OutMessageSchema['Type']
          : never
      >,
  ): Definition<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  >
  <
    const ModelSchema extends Schema.Codec<any, any, any, any>,
    const MessageSchema extends Schema.Codec<any, any, any, any>,
    const Mounts extends ReadonlyArray<Mount.LayeredMountDefinition> =
      readonly [],
    const Children extends ReadonlyArray<AnyBinding> = readonly [],
  >(
    config: Readonly<{
      Model: ModelSchema
      Message: MessageSchema
      OutMessage?: never
      mounts?: Mounts & Mount.PreciseMountRegistry<Mounts>
      children?: Children
    }> &
      ValidateChildBindings<
        Children,
        ModelSchema['Type'],
        MessageSchema['Type'],
        never
      >,
  ): Definition<
    OwnerValue,
    ModelSchema,
    MessageSchema,
    undefined,
    Mounts,
    Children
  >
}

const makeDefineView = <
  Model,
  Message,
  RequiredMountRequirements,
>(): DefineView<Model, Message, RequiredMountRequirements> => {
  const defineView = (
    view: (
      model: Model,
      h: HtmlBuilder<Message, RequiredMountRequirements>,
    ) => VNode | null,
  ): SubmodelView<Model, Message, void, RequiredMountRequirements> =>
    defineHtmlView<Model, Message, void, RequiredMountRequirements>(view)

  const withInputs = <ViewInputs = never>(
    view: ViewWithInputs<Model, Message, ViewInputs, RequiredMountRequirements>,
  ): SubmodelView<
    Model,
    Message,
    ValidViewInputs<ViewInputs>,
    RequiredMountRequirements
  > => {
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    return defineHtmlView(view as any) as SubmodelView<
      Model,
      Message,
      ValidViewInputs<ViewInputs>,
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
    (model: Model, message: Message, ...context: Context) => Output,
    Model,
    Message
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
  ): DefinedStep<(model: Model, ...context: Context) => Output, Model, Message>
  function defineStep(step: AnyFunction): AnyFunction {
    return step
  }

  return defineStep
}

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
        `[foldkit] Submodel ManagedResource registrations "${previous}" and "${registrationKey}" share the resource tag "${resource.key}". Bind each ManagedResource owner only once.`,
      )
    }

    owners.set(resource.key, registrationKey)
  }
}

// oxlint-disable effecttsgo/any-unknown-in-error-context
const assertCompatibleChildOwners = (
  owner: Owner<any>,
  EffectsLayer: AnyLayer | undefined,
  children: ReadonlyArray<AnyBinding>,
): void => {
  const owners = new Map<
    string,
    Readonly<{ owner: object; EffectsLayer: unknown }>
  >()
  owners.set(owner.namespace, { owner, EffectsLayer })

  const visit = (child: AnyBinding): void => {
    const childDefinition = definitionOf(child)
    const childOwnerValue = childDefinition.owner
    if (
      !Predicate.isObject(childOwnerValue) ||
      !Predicate.hasProperty(childOwnerValue, 'namespace') ||
      !Predicate.isString(childOwnerValue.namespace)
    ) {
      throw new Error(
        '[foldkit] A Submodel binding must reference a descriptor with an Owner.',
      )
    }

    const childOwner = childOwnerValue
    const childEffectsLayer = Predicate.hasProperty(
      childDefinition,
      OwnerEffectsLayerTypeId,
    )
      ? childDefinition[OwnerEffectsLayerTypeId]
      : child.EffectsLayer
    const previous = owners.get(childOwner.namespace)

    if (previous === undefined) {
      owners.set(childOwner.namespace, {
        owner: childOwner,
        EffectsLayer: childEffectsLayer,
      })
    } else if (previous.owner !== childOwner) {
      throw new Error(
        `[foldkit] Submodel owner namespace "${childOwner.namespace}" was created more than once in one composition. Reuse the same Owner value for refinements and placements.`,
      )
    } else if (
      previous.EffectsLayer !== undefined &&
      previous.EffectsLayer !== childEffectsLayer
    ) {
      throw new Error(
        `[foldkit] Submodel owner "${childOwner.namespace}" uses different EffectsLayer recipes in one composition. Select one provider recipe for every simultaneous placement.`,
      )
    } else {
      owners.set(childOwner.namespace, {
        owner: childOwner,
        EffectsLayer: childEffectsLayer,
      })
    }

    for (const nestedChild of childDefinition.children) {
      visit(nestedChild)
    }
  }

  for (const child of children) {
    visit(child)
  }
}

/**
 * @internal Runtime constructor behind {@link DefineOwnedSubmodel}.
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
): any => {
  const localMounts = config.mounts ?? []
  const children = config.children ?? []

  assertCompatibleChildOwners(owner, undefined, children)

  const childChannels = aggregateChildren(children)
  const mounts = mergeMounts(localMounts, childChannels.mounts)

  const defineView = makeDefineView()
  const defineUpdate = makeDefineUpdate()
  const defineStep = makeDefineStep()

  function compose(composition: {
    readonly view?: AnySubmodelView
    readonly init: AnyFunction
    readonly update: AnyFunction
    readonly steps?: Readonly<Record<string, AnyFunction>>
    readonly subscriptions?: AnySubscriptions
    readonly managedResources?: AnyManagedResources
    readonly EffectsLayer: AnyLayer
    readonly hostHandlers?: ReadonlyArray<unknown>
  }): AnyDescriptor {
    const steps = composition.steps ?? {}
    const subscriptions = Subscription.aggregate(
      composition.subscriptions ?? {},
      childChannels.subscriptions,
    )
    const managedResources = ManagedResource.aggregate(
      composition.managedResources ?? {},
      childChannels.managedResources,
    )
    assertCompatibleChildOwners(owner, composition.EffectsLayer, children)

    const EffectsLayer = Array.isReadonlyArrayEmpty(children)
      ? composition.EffectsLayer
      : Layer.merge(composition.EffectsLayer, childChannels.EffectsLayer)
    const hostHandlers = composition.hostHandlers ?? []

    assertDistinctManagedResourceOwners(managedResources)

    function bind(bindingConfig: unknown): AnyBinding {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      return bindDescriptor(descriptor, bindingConfig as never)
    }

    function withEffectsLayer(EffectsLayer: AnyLayer): AnyDescriptor {
      return compose({ ...composition, EffectsLayer })
    }

    const descriptor = {
      owner,
      Model: config.Model,
      Message: config.Message,
      ...(config.OutMessage === undefined
        ? {}
        : { OutMessage: config.OutMessage }),
      ...(composition.view === undefined ? {} : { view: composition.view }),
      mounts,
      children,
      init: composition.init,
      update: composition.update,
      steps,
      subscriptions,
      managedResources,
      EffectsLayer,
      hostHandlers,
      [OwnerEffectsLayerTypeId]: composition.EffectsLayer,
      withEffectsLayer,
      bind,
    }

    return descriptor
  }

  return {
    owner,
    Model: config.Model,
    Message: config.Message,
    ...(config.OutMessage === undefined
      ? {}
      : { OutMessage: config.OutMessage }),
    mounts,
    children,
    defineView,
    defineUpdate,
    defineStep,
    compose,
  }
}
// oxlint-enable effecttsgo/any-unknown-in-error-context
