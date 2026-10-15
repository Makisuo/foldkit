import type { Schema } from 'effect'

import type * as Mount from '../mount/index.js'
import type { AnyBinding } from './binding.js'
import type { Base, Composition, ValidateChildBindings } from './definition.js'
import {
  type DefineCommand,
  type DefineMount,
  type DefineMountStream,
  type DefineResource,
  makeAuthoringContext,
} from './named.js'
import type { Owner } from './owner.js'

type AnySchema = Schema.Codec<any, any, any, any>

/** Effect declaration helpers scoped to one Block identity. */
export type Primitives<Id extends string, Message = unknown> = Readonly<{
  /** Defines a Command whose runtime name is owned by this Block. */
  command: DefineCommand<Id, Message>
  /** Defines a one-shot Mount whose runtime name is owned by this Block. */
  mount: DefineMount<Id, Message>
  /** Defines a streaming Mount whose runtime name is owned by this Block. */
  mountStream: DefineMountStream<Id, Message>
  /** Defines a ManagedResource service identity owned by this Block. */
  resource: DefineResource<Id>
}>

/** Registers the child and Mount graph while retaining the Block's authoring
 * methods. This step only records composition; it does not construct Layers or
 * start lifecycle work. */
export interface AuthoringToComposition<
  Id extends string,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Concrete extends boolean = true,
> {
  (): Composition<
    Owner<Id, Concrete>,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    readonly [],
    readonly []
  > &
    Primitives<Id, MessageSchema['Type']>
  <
    const Mounts extends ReadonlyArray<Mount.LayeredMountDefinition> =
      readonly [],
    const Children extends ReadonlyArray<AnyBinding> = readonly [],
  >(
    config: Readonly<{
      /** Mount definitions owned directly by this Block. Omitted Mounts default
       * to an empty registry. */
      mounts?: Mounts & Mount.PreciseMountRegistry<Mounts>
      /** Child Bindings registered in this Block's composition graph. Omitted
       * children default to an empty tuple. */
      children?: Children
    }> &
      ValidateChildBindings<
        Children,
        ModelSchema['Type'],
        MessageSchema['Type'],
        OutMessageSchema extends AnySchema ? OutMessageSchema['Type'] : never
      >,
  ): Composition<
    Owner<Id, Concrete>,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  > &
    Primitives<Id, MessageSchema['Type']>
}

/** Typed authoring helpers and owned effect declarations before graph
 * registration. */
export type AuthoringDefinition<
  Id extends string,
  ModelSchema extends AnySchema,
  MessageSchema extends AnySchema,
  OutMessageSchema extends AnySchema | undefined,
  Concrete extends boolean = true,
> = Omit<
  Base<Owner<Id, Concrete>, ModelSchema, MessageSchema, OutMessageSchema>,
  'toComposition'
> &
  Primitives<Id, MessageSchema['Type']> &
  Readonly<{
    /** Registers this Definition's child and Mount graph and returns the passive
     * Composition used to author its view and complete its Block. */
    toComposition: AuthoringToComposition<
      Id,
      ModelSchema,
      MessageSchema,
      OutMessageSchema,
      Concrete
    >
  }>

/** Establishes Model, Message, and optional OutMessage Schemas under an already
 * declared Block identity. */
export interface DefineContracts<
  Id extends string,
  Concrete extends boolean = true,
> {
  <
    const ModelSchema extends AnySchema,
    const MessageSchema extends AnySchema,
    const OutMessageSchema extends AnySchema,
  >(
    config: Readonly<{
      /** Schema for the Block's Model. */
      Model: ModelSchema
      /** Schema for facts the Block's update function handles. */
      Message: MessageSchema
      /** Schema for facts the Block can report to a parent. */
      OutMessage: OutMessageSchema
      mounts?: never
      children?: never
    }>,
  ): AuthoringDefinition<
    Id,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Concrete
  >
  <const ModelSchema extends AnySchema, const MessageSchema extends AnySchema>(
    config: Readonly<{
      /** Schema for the Block's Model. */
      Model: ModelSchema
      /** Schema for facts the Block's update function handles. */
      Message: MessageSchema
      OutMessage?: never
      mounts?: never
      children?: never
    }>,
  ): AuthoringDefinition<Id, ModelSchema, MessageSchema, undefined, Concrete>
}

/** A Block identity whose owned effects can be declared before a generic
 * factory establishes its Model and Message contracts. */
export type Authoring<
  Id extends string,
  Concrete extends boolean = true,
> = Primitives<Id> &
  Readonly<{
    /** Establishes a typed Definition under this existing Block identity. */
    define: DefineContracts<Id, Concrete>
  }>

/** Defines a Block identity before a generic factory establishes its Model and
 * Message contracts. The returned authoring value is passive configuration. */
export function define(
  id: '' | `${string}/${string}` | `${string}::${string}`,
): never
export function define<const Id extends string>(
  id: Id & (string extends Id ? never : unknown),
): Authoring<Id, true>
export function define<const Id extends string>(id: Id): Authoring<Id, false>
/** Defines one Block's identity, Schemas, typed authoring helpers, and owned
 * effect declarations. The returned Definition is passive configuration. */
export function define<
  const Id extends string,
  const ModelSchema extends AnySchema,
  const MessageSchema extends AnySchema,
  const OutMessageSchema extends AnySchema,
>(
  id: (Id extends '' | `${string}/${string}` | `${string}::${string}`
    ? never
    : Id) &
    (string extends Id ? never : unknown),
  config: Readonly<{
    Model: ModelSchema
    Message: MessageSchema
    OutMessage: OutMessageSchema
    mounts?: never
    children?: never
  }>,
): AuthoringDefinition<Id, ModelSchema, MessageSchema, OutMessageSchema, true>
/** Defines one Block's identity, Schemas, typed authoring helpers, and owned
 * effect declarations. The returned Definition is passive configuration. */
export function define<
  const Id extends string,
  const ModelSchema extends AnySchema,
  const MessageSchema extends AnySchema,
>(
  id: (Id extends '' | `${string}/${string}` | `${string}::${string}`
    ? never
    : Id) &
    (string extends Id ? never : unknown),
  config: Readonly<{
    Model: ModelSchema
    Message: MessageSchema
    OutMessage?: never
    mounts?: never
    children?: never
  }>,
): AuthoringDefinition<Id, ModelSchema, MessageSchema, undefined, true>
/** Defines one Block's identity, Schemas, typed authoring helpers, and owned
 * effect declarations. The returned Definition is passive configuration. */
export function define<
  const Id extends string,
  const ModelSchema extends AnySchema,
  const MessageSchema extends AnySchema,
  const OutMessageSchema extends AnySchema,
>(
  id: Id extends '' | `${string}/${string}` | `${string}::${string}`
    ? never
    : Id,
  config: Readonly<{
    Model: ModelSchema
    Message: MessageSchema
    OutMessage: OutMessageSchema
    mounts?: never
    children?: never
  }>,
): AuthoringDefinition<Id, ModelSchema, MessageSchema, OutMessageSchema, false>
/** Defines one Block's identity, Schemas, typed authoring helpers, and owned
 * effect declarations. The returned Definition is passive configuration. */
export function define<
  const Id extends string,
  const ModelSchema extends AnySchema,
  const MessageSchema extends AnySchema,
>(
  id: Id extends '' | `${string}/${string}` | `${string}::${string}`
    ? never
    : Id,
  config: Readonly<{
    Model: ModelSchema
    Message: MessageSchema
    OutMessage?: never
    mounts?: never
    children?: never
  }>,
): AuthoringDefinition<Id, ModelSchema, MessageSchema, undefined, false>
export function define(
  id: string,
  config?: Readonly<{
    Model: AnySchema
    Message: AnySchema
    OutMessage?: AnySchema
  }>,
): any {
  const authoring = makeAuthoringContext(id)
  const primitives = {
    command: authoring.command,
    mount: authoring.mount,
    mountStream: authoring.mountStream,
    resource: authoring.resource,
  }
  const defineContracts = (
    contracts: Readonly<{
      Model: AnySchema
      Message: AnySchema
      OutMessage?: AnySchema
    }>,
  ) => {
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    const base = authoring.define(contracts as never)
    const toComposition = (
      graph: Readonly<{
        mounts?: ReadonlyArray<Mount.LayeredMountDefinition>
        children?: ReadonlyArray<AnyBinding>
      }> = {},
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ) => ({ ...base.toComposition(graph as never), ...primitives })

    return { ...base, ...primitives, toComposition }
  }

  if (config === undefined) {
    return { ...primitives, define: defineContracts }
  } else {
    return defineContracts(config)
  }
}
