import type { Effect, Layer, Scope, Stream } from 'effect'

import type { Handler as CommandHandler } from '../command/handler.js'
import type { Handler as ManagedResourceHandler } from '../managedResource/handler.js'
import type { ServicesOf as ManagedResourceServicesOf } from '../managedResource/index.js'
import type { Handler as MountHandler } from '../mount/handler.js'
import type { MountAction } from '../mount/index.js'
import type { ValidHandlerContracts } from '../runtime/handlerContracts.js'
import type { Handler as SubscriptionHandler } from '../subscription/handler.js'
import type * as Update from '../update/index.js'
import type { DefinitionOfBinding } from './binding.js'

type AnyFunction = (...args: ReadonlyArray<any>) => any

type AnyHandler =
  | CommandHandler<any, any, any>
  | SubscriptionHandler<any, any, any>
  | MountHandler<any, any, any>
  | ManagedResourceHandler<any, any, any>

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false

type ErasedRequirement<Source extends string, Requirements> =
  IsAny<Requirements> extends true
    ? Source
    : IsUnknown<Requirements> extends true
      ? Source
      : never

type HandlerRequirements<Requirements> = Requirements extends AnyHandler
  ? Requirements
  : never

/**
 * @internal Extracts Command requirements from producers and Step factories.
 */
export type ProducerRequirements<Producer> =
  IsAny<Producer> extends true
    ? Producer
    : Producer extends AnyFunction
      ? IsAny<ReturnType<Producer>> extends true
        ? ReturnType<Producer>
        : IsUnknown<ReturnType<Producer>> extends true
          ? unknown
          : ReturnType<Producer> extends AnyFunction
            ? ProducerRequirements<ReturnType<Producer>>
            : Update.RequirementsOf<Producer>
      : never

type ProducerRecordRequirements<Producers> = Producers extends object
  ? ProducerRequirements<Producers[keyof Producers]>
  : never

/**
 * @internal Extracts requirements from a Subscription registry.
 */
export type SubscriptionRequirements<Subscriptions> =
  Subscriptions extends Readonly<Record<string, infer Subscription>>
    ? Subscription extends Readonly<{
        dependenciesToStream: (
          ...args: ReadonlyArray<any>
        ) => Stream.Stream<any, any, infer Requirements>
      }>
      ? Requirements
      : never
    : never

/**
 * @internal Extracts requirements from registered Mount definitions.
 */
export type MountRequirements<Mounts> =
  Mounts extends ReadonlyArray<infer Definition>
    ? Definition extends (...args: ReadonlyArray<any>) => infer Action
      ? Action extends MountAction<any, any, infer Requirements>
        ? Requirements
        : never
      : never
    : never

/**
 * @internal Extracts requirements used while acquiring or releasing resources.
 */
export type ManagedResourceLifecycleRequirements<ManagedResources> =
  ManagedResources extends Readonly<Record<string, infer Entry>>
    ?
        | (Entry extends Readonly<{
            acquire: (
              ...args: ReadonlyArray<any>
            ) => Effect.Effect<any, any, infer Requirements>
          }>
            ? Exclude<Requirements, Scope.Scope>
            : never)
        | (Entry extends Readonly<{
            release: (
              ...args: ReadonlyArray<any>
            ) => Effect.Effect<any, any, infer Requirements>
          }>
            ? Exclude<Requirements, Scope.Scope>
            : never)
    : never

/**
 * @internal Extracts services installed by registered ManagedResources.
 */
export type ManagedResourceRuntimeServices<ManagedResources> =
  ManagedResourceServicesOf<ManagedResources>

/**
 * @internal Extracts the services produced by a Layer recipe.
 */
export type LayerOutputs<LayerRecipe> = LayerRecipe extends Layer.Any
  ? Layer.Success<LayerRecipe>
  : never

/**
 * @internal Extracts the services needed to construct a Layer recipe.
 */
export type LayerInputs<LayerRecipe> = LayerRecipe extends Layer.Any
  ? Layer.Services<LayerRecipe>
  : never

type InvocationRequirements<Definition> = Definition extends (
  ...args: ReadonlyArray<any>
) => infer Invocation
  ?
      | (Invocation extends Readonly<{
          effect: Effect.Effect<any, any, infer Requirements>
        }>
          ? Requirements
          : never)
      | (Invocation extends MountAction<any, any, infer Requirements>
          ? Requirements
          : never)
  : never

type LifecycleRequirements<Definition> =
  | (Definition extends Readonly<{
      acquire: (
        ...args: ReadonlyArray<any>
      ) => Effect.Effect<any, any, infer Requirements>
    }>
      ? Exclude<Requirements, Scope.Scope>
      : never)
  | (Definition extends Readonly<{
      release: (
        ...args: ReadonlyArray<any>
      ) => Effect.Effect<any, any, infer Requirements>
    }>
      ? Exclude<Requirements, Scope.Scope>
      : never)

type HostDefinitionRequirements<Definition> =
  Definition extends Readonly<{ toLayer: AnyFunction }>
    ?
        | InvocationRequirements<Definition>
        | SubscriptionRequirements<Readonly<{ entry: Definition }>>
        | LifecycleRequirements<Definition>
    : never

/**
 * @internal Extracts the exact handler contract declared by a host entry.
 */
export type HandlerOfHostDefinition<Definition> = HandlerRequirements<
  HostDefinitionRequirements<Definition>
>

type HostDefinitions<Descriptor> =
  Descriptor extends Readonly<{
    hostHandlers: ReadonlyArray<infer Definition>
  }>
    ? Definition
    : never

type DeclaredHostHandlers<Descriptor> = HandlerOfHostDefinition<
  HostDefinitions<Descriptor>
>

type DescriptorLayer<Descriptor> =
  Descriptor extends Readonly<{ EffectsLayer: infer LayerRecipe }>
    ? LayerRecipe
    : never

type DescriptorManagedResources<Descriptor> =
  Descriptor extends Readonly<{ managedResources: infer ManagedResources }>
    ? ManagedResources
    : Readonly<Record<never, never>>

type LocalOperationRequirements<Descriptor> =
  | (Descriptor extends Readonly<{ init: infer Init }>
      ? ProducerRequirements<Init>
      : never)
  | (Descriptor extends Readonly<{ update: infer UpdateFunction }>
      ? ProducerRequirements<UpdateFunction>
      : never)
  | (Descriptor extends Readonly<{ steps: infer Steps }>
      ? ProducerRecordRequirements<Steps>
      : never)
  | (Descriptor extends Readonly<{ subscriptions: infer Subscriptions }>
      ? SubscriptionRequirements<Subscriptions>
      : never)
  | ManagedResourceLifecycleRequirements<DescriptorManagedResources<Descriptor>>
  | (Descriptor extends Readonly<{ mounts: infer Mounts }>
      ? MountRequirements<Mounts>
      : never)

type BindingInheritedRequirements<Binding> = RequirementsOfDescriptor<
  DefinitionOfBinding<Binding>
>

type BindingDefinitionOperationRequirements<Binding> =
  OperationRequirementsOfDescriptor<DefinitionOfBinding<Binding>>

type BindingOwnOperationRequirements<Binding> =
  | (Binding extends Readonly<{ fold: infer Fold }>
      ? ProducerRequirements<Fold>
      : never)
  | (Binding extends Readonly<{ step: infer Step }>
      ? ProducerRequirements<Step>
      : never)
  | (Binding extends Readonly<{ steps: infer Steps }>
      ? ProducerRecordRequirements<Steps>
      : never)
  | (Binding extends Readonly<{ subscriptions: infer Subscriptions }>
      ? SubscriptionRequirements<Subscriptions>
      : never)
  | (Binding extends Readonly<{ managedResources: infer ManagedResources }>
      ? ManagedResourceLifecycleRequirements<ManagedResources>
      : never)
  | (Binding extends Readonly<{ mounts: infer Mounts }>
      ? MountRequirements<Mounts>
      : never)

type ChildInheritedRequirements<Descriptor> =
  Descriptor extends Readonly<{
    children: ReadonlyArray<infer Binding>
  }>
    ? BindingInheritedRequirements<Binding>
    : never

type ChildOwnOperationRequirements<Descriptor> =
  Descriptor extends Readonly<{
    children: ReadonlyArray<infer Binding>
  }>
    ? BindingOwnOperationRequirements<Binding>
    : never

type ChildOperationRequirements<Descriptor> =
  Descriptor extends Readonly<{
    children: ReadonlyArray<infer Binding>
  }>
    ?
        | BindingDefinitionOperationRequirements<Binding>
        | BindingOwnOperationRequirements<Binding>
    : never

/**
 * @internal The unchanged services used by a descriptor's operations and the
 * operations of its owned child bindings. Selected Layers and runtime-managed
 * handles do not alter this contract.
 */
export type OperationRequirementsOfDescriptor<Descriptor> =
  | LocalOperationRequirements<Descriptor>
  | ChildOperationRequirements<Descriptor>

type AssemblyOperationRequirements<Descriptor> =
  | LocalOperationRequirements<Descriptor>
  | ChildOwnOperationRequirements<Descriptor>

type ResidualRequirements<Descriptor> =
  | Exclude<
      | Exclude<
          AssemblyOperationRequirements<Descriptor>,
          ManagedResourceRuntimeServices<DescriptorManagedResources<Descriptor>>
        >
      | ChildInheritedRequirements<Descriptor>,
      LayerOutputs<DescriptorLayer<Descriptor>>
    >
  | LayerInputs<DescriptorLayer<Descriptor>>

/**
 * @internal The services a composed Submodel carries to its parent or root.
 * Registered ManagedResource handles satisfy operation requirements after
 * startup. The selected Layer graph satisfies matching operation services;
 * Layer construction inputs remain requirements.
 */
export type RequirementsOfDescriptor<Descriptor> =
  ResidualRequirements<Descriptor>

type ResidualHandlers<Descriptor> = HandlerRequirements<
  ResidualRequirements<Descriptor>
>

type MissingHostHandlers<Descriptor> = Exclude<
  ResidualHandlers<Descriptor>,
  DeclaredHostHandlers<Descriptor>
>

type UnexpectedHostHandlers<Descriptor> = Exclude<
  DeclaredHostHandlers<Descriptor>,
  ResidualHandlers<Descriptor>
>

type InvalidHostDefinitions<Descriptor> =
  HostDefinitions<Descriptor> extends infer Definition
    ? Definition extends unknown
      ? [HandlerOfHostDefinition<Definition>] extends [never]
        ? Definition
        : never
      : never
    : never

type PrecisionFailures<Descriptor> =
  | ErasedRequirement<
      'init, update, or steps',
      ProducerRequirements<
        | (Descriptor extends Readonly<{ init: infer Init }> ? Init : never)
        | (Descriptor extends Readonly<{ update: infer UpdateFunction }>
            ? UpdateFunction
            : never)
        | (Descriptor extends Readonly<{ steps: infer Steps }>
            ? Steps extends object
              ? Steps[keyof Steps]
              : never
            : never)
      >
    >
  | ErasedRequirement<
      'subscriptions',
      Descriptor extends Readonly<{ subscriptions: infer Subscriptions }>
        ? SubscriptionRequirements<Subscriptions>
        : never
    >
  | ErasedRequirement<
      'managed resources',
      | ManagedResourceLifecycleRequirements<
          DescriptorManagedResources<Descriptor>
        >
      | ManagedResourceRuntimeServices<DescriptorManagedResources<Descriptor>>
    >
  | ErasedRequirement<
      'mounts',
      Descriptor extends Readonly<{ mounts: infer Mounts }>
        ? MountRequirements<Mounts>
        : never
    >
  | ErasedRequirement<
      'EffectsLayer outputs',
      LayerOutputs<DescriptorLayer<Descriptor>>
    >
  | ErasedRequirement<
      'EffectsLayer inputs',
      LayerInputs<DescriptorLayer<Descriptor>>
    >
  | ErasedRequirement<
      'children',
      | ChildInheritedRequirements<Descriptor>
      | ChildOperationRequirements<Descriptor>
    >
  | ErasedRequirement<'hostHandlers', DeclaredHostHandlers<Descriptor>>

type ValidatePreciseRequirements<Descriptor> = [
  PrecisionFailures<Descriptor>,
] extends [never]
  ? unknown
  : Readonly<{
      'Submodel requirement sources must preserve exact service types': PrecisionFailures<Descriptor>
    }>

type ValidateHostDefinitions<Descriptor> = [
  InvalidHostDefinitions<Descriptor>,
] extends [never]
  ? unknown
  : Readonly<{
      'Submodel hostHandlers must contain layered Foldkit definitions': InvalidHostDefinitions<Descriptor>
    }>

type ValidateMissingHostHandlers<Descriptor> = [
  MissingHostHandlers<Descriptor>,
] extends [never]
  ? unknown
  : Readonly<{
      'Submodel handler requirements must be provided locally or listed in hostHandlers': MissingHostHandlers<Descriptor>
    }>

type ValidateUnexpectedHostHandlers<Descriptor> = [
  UnexpectedHostHandlers<Descriptor>,
] extends [never]
  ? unknown
  : Readonly<{
      'Submodel hostHandlers must match residual handler requirements': UnexpectedHostHandlers<Descriptor>
    }>

type HandlerContracts<Descriptor> = HandlerRequirements<
  | OperationRequirementsOfDescriptor<Descriptor>
  | LayerOutputs<DescriptorLayer<Descriptor>>
  | LayerInputs<DescriptorLayer<Descriptor>>
  | DeclaredHostHandlers<Descriptor>
>

/**
 * @internal Validates handler completeness and exact service inference.
 */
export type ValidateComposition<_Definition, Composition> =
  ValidatePreciseRequirements<Composition> &
    ValidateHostDefinitions<Composition> &
    ValidateMissingHostHandlers<Composition> &
    ValidateUnexpectedHostHandlers<Composition> &
    ValidHandlerContracts<HandlerContracts<Composition>>
