import type { Schema } from 'effect'

import type {
  AnyBinding,
  InspectionOfConnection,
  RequirementsOfBindings,
} from '../block/binding.js'
import { define as defineBlock } from '../block/define.js'
import {
  type Definition as BlockDefinition,
  type CompletedForValidation,
  type DefineManagedResources,
  type DefineStep,
  type DefineSubscriptions,
  type DefineUpdate,
  type DefineView,
  type ValidateChildBindings,
  makeDefinition,
} from '../block/definition.js'
import {
  type DefineCommand,
  type DefineMount,
  type DefineMountStream,
  type DefineResource,
} from '../block/named.js'
import type { Owner } from '../block/owner.js'
import type { HtmlBuilder } from '../html/index.js'
import type * as Mount from '../mount/index.js'
import type { Make, MakeElement } from './application.js'

type AnySchema = Schema.Codec<any, any, any, any>
type RootOwner = Owner<'Application', true>

type AuthoringHelpers<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
> = Readonly<{
  command: DefineCommand<'Application', MessageSchema['Type']>
  mount: DefineMount<'Application', MessageSchema['Type']>
  mountStream: DefineMountStream<'Application', MessageSchema['Type']>
  resource: DefineResource<'Application'>
  update: DefineUpdate<ModelSchema['Type'], MessageSchema['Type'], never, true>
  step: DefineStep<ModelSchema['Type'], MessageSchema['Type'], never>
  subscriptions: DefineSubscriptions<
    'Application',
    ModelSchema['Type'],
    MessageSchema['Type']
  >
  managedResources: DefineManagedResources<
    'Application',
    ModelSchema['Type'],
    MessageSchema['Type']
  >
}>

declare const CompositionTypeId: unique symbol

type CompositionEvidence<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  Model: ModelSchema
  Message: MessageSchema
  Mounts: Mounts
  Children: Children
}>

type CompositionIdentity<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  [CompositionTypeId]: CompositionEvidence<
    ModelSchema,
    MessageSchema,
    Mounts,
    Children
  >
}>

type CompletionHelpers<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  make: Make<CompositionIdentity<ModelSchema, MessageSchema, Mounts, Children>>
  makeElement: MakeElement<
    CompositionIdentity<ModelSchema, MessageSchema, Mounts, Children>
  >
}>

type EvidenceOf<CompositionValue> =
  CompositionValue extends Readonly<{
    [CompositionTypeId]: infer Evidence
  }>
    ? Evidence
    : never

/** @internal Reads the exact root Model Schema from a composition. */
export type ModelSchemaOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    infer ModelSchema,
    AnySchema,
    ReadonlyArray<Mount.LayeredMountDefinition>,
    ReadonlyArray<AnyBinding>
  >
    ? ModelSchema
    : never

/** @internal Reads the exact root Message Schema from a composition. */
export type MessageSchemaOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    AnySchema,
    infer MessageSchema,
    ReadonlyArray<Mount.LayeredMountDefinition>,
    ReadonlyArray<AnyBinding>
  >
    ? MessageSchema
    : never

/** @internal Reads the exact registered Mount tuple from a composition. */
export type MountsOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    AnySchema,
    AnySchema,
    infer Mounts,
    ReadonlyArray<AnyBinding>
  >
    ? readonly [
        ...Mounts,
        ...ReadonlyArray<
          InspectionOfConnection<
            ChildrenOf<CompositionValue>[number]
          >['mounts'][number]
        >,
      ]
    : never

/** @internal Reads the exact registered child tuple from a composition. */
export type ChildrenOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    AnySchema,
    AnySchema,
    ReadonlyArray<Mount.LayeredMountDefinition>,
    infer Children
  >
    ? Children
    : never

/** @internal Reads the Mount requirements available to the root view. */
export type MountRequirementsOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    AnySchema,
    AnySchema,
    infer Mounts,
    infer Children
  >
    ? Mount.RequirementsOf<Mounts> | RequirementsOfBindings<Children>
    : never

/**
 * A passive application root after its child and Mount graph is known. Call
 * its `make` or `makeElement` method to complete it. It cannot be bound into
 * another composition.
 */
export type Composition<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  Mounts extends ReadonlyArray<Mount.LayeredMountDefinition>,
  Children extends ReadonlyArray<AnyBinding>,
> = Readonly<{
  Model: ModelSchema
  Message: MessageSchema
  mounts: readonly [
    ...Mounts,
    ...ReadonlyArray<
      InspectionOfConnection<Children[number]>['mounts'][number]
    >,
  ]
  children: Children
  view: DefineView<
    RootOwner,
    ModelSchema['Type'],
    MessageSchema['Type'],
    Mount.RequirementsOf<Mounts> | RequirementsOfBindings<Children>
  >
  [CompositionTypeId]: CompositionEvidence<
    ModelSchema,
    MessageSchema,
    Mounts,
    Children
  >
}> &
  AuthoringHelpers<ModelSchema, MessageSchema> &
  CompletionHelpers<ModelSchema, MessageSchema, Mounts, Children>

/**
 * The builder supplied by an application definition or registered
 * composition. Use it when an extracted root view helper renders registered
 * children or local Mounts.
 */
export type HtmlBuilderOf<ApplicationValue> =
  ApplicationValue extends AnyComposition
    ? HtmlBuilder<
        MessageSchemaOf<ApplicationValue>['Type'],
        MountRequirementsOf<ApplicationValue>
      >
    : ApplicationValue extends Readonly<{
          Message: Readonly<{ Type: infer Message }>
          register: (...args: ReadonlyArray<any>) => unknown
        }>
      ? HtmlBuilder<Message, never>
      : never

/** @internal Structural bound for a staged application composition. */
export type AnyComposition = Readonly<{
  [CompositionTypeId]: CompositionEvidence<any, any, any, any>
}>

/** @internal Recovers the private Block definition behind a composition. */
export type DefinitionOf<CompositionValue> =
  EvidenceOf<CompositionValue> extends CompositionEvidence<
    infer ModelSchema,
    infer MessageSchema,
    infer Mounts,
    infer Children
  >
    ? BlockDefinition<
        RootOwner,
        ModelSchema,
        MessageSchema,
        undefined,
        Mounts,
        Children
      >
    : never

/** @internal Forms the checked Block shape used only at the runtime boundary. */
export type CompletedComposition<CompositionValue, Implementation> =
  CompletedForValidation<DefinitionOf<CompositionValue>, Implementation>

/** Registers the child and Mount graph with an application authoring namespace. */
export interface Register<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
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
        never
      >,
  ): Composition<ModelSchema, MessageSchema, Mounts, Children>
}

/**
 * Root application authoring available as soon as its Model and Message are
 * known. Primitive identities are private to this application root.
 */
export type Definition<
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
> = Composition<ModelSchema, MessageSchema, readonly [], readonly []> &
  Readonly<{
    register: Register<ModelSchema, MessageSchema>
  }>

/** Defines the root Model, Message, and primitive authoring namespace. */
export interface Define {
  <const ModelSchema extends AnySchema, const MessageSchema extends AnySchema>(
    config: Readonly<{
      Model: ModelSchema
      Message: MessageSchema
    }>,
  ): Definition<ModelSchema, MessageSchema>
}

const definitions = new WeakMap<
  object,
  globalThis.ReturnType<typeof makeDefinition>
>()

type Completion = Readonly<{
  make: (composition: AnyComposition, config: any) => any
  makeElement: (composition: AnyComposition, config: any) => any
}>

const makeComposition = (
  definition: globalThis.ReturnType<typeof makeDefinition>,
  primitives: Readonly<{
    command: DefineCommand<'Application'>
    mount: DefineMount<'Application'>
    mountStream: DefineMountStream<'Application'>
    resource: DefineResource<'Application'>
  }>,
  completion: Completion,
) => {
  const composition = {
    Model: definition.Model,
    Message: definition.Message,
    mounts: definition.mounts,
    children: definition.children,
    view: definition.view,
    command: primitives.command,
    mount: primitives.mount,
    mountStream: primitives.mountStream,
    resource: primitives.resource,
    update: definition.update,
    step: definition.step,
    subscriptions: definition.subscriptions,
    managedResources: definition.managedResources,
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    make: (config: any) => completion.make(composition as never, config),
    makeElement: (config: any) =>
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      completion.makeElement(composition as never, config),
  }
  definitions.set(composition, definition)
  return composition
}

/** @internal Returns the private Block definition for root completion. */
export const definitionOf = (
  composition: object,
): globalThis.ReturnType<typeof makeDefinition> => {
  const definition = definitions.get(composition)
  if (definition === undefined) {
    throw new Error(
      '[foldkit] Application definition must come from defineApplication(...) or its register(...) result.',
    )
  }
  return definition
}

/** @internal Completes a passive application root without reading browser state. */
export const complete = <
  CompositionValue extends AnyComposition,
  Implementation,
>(
  composition: CompositionValue,
  implementation: Implementation,
): CompletedComposition<CompositionValue, Implementation> =>
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  definitionOf(composition).toBlock(implementation as never)

/** @internal Creates the public staged application definition function. */
export const makeDefine =
  (completion: Completion): Define =>
  config => {
    const base = defineBlock('Application', config)
    const primitives = {
      command: base.command,
      mount: base.mount,
      mountStream: base.mountStream,
      resource: base.resource,
    }

    const register = (
      graph: Readonly<{
        mounts?: ReadonlyArray<Mount.LayeredMountDefinition>
        children?: ReadonlyArray<AnyBinding>
      }>,
    ) => {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      const definition = base.register(graph as never)
      return makeComposition(definition, primitives, completion)
    }

    const composition = makeComposition(base, primitives, completion)
    const definition = {
      ...composition,
      register,
    }
    definitions.set(definition, base)

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    return definition as never
  }
