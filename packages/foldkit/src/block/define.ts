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

/** Owned effect declarations shared by every contract of one Block. */
export type Primitives<Id extends string, Message = unknown> = Readonly<{
  command: DefineCommand<Id, Message>
  mount: DefineMount<Id, Message>
  mountStream: DefineMountStream<Id, Message>
  resource: DefineResource<Id>
}>

/** Registers graph capabilities while retaining the Block's authoring methods. */
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
    Owner<Id, Concrete>,
    ModelSchema,
    MessageSchema,
    OutMessageSchema,
    Mounts,
    Children
  > &
    Primitives<Id, MessageSchema['Type']>
}

/** Typed helpers and owned primitives for a Block before graph registration. */
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
    toComposition: AuthoringToComposition<
      Id,
      ModelSchema,
      MessageSchema,
      OutMessageSchema,
      Concrete
    >
  }>

/** Establishes typed contracts under an already declared Block identity. */
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
      Model: ModelSchema
      Message: MessageSchema
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
      Model: ModelSchema
      Message: MessageSchema
      OutMessage?: never
      mounts?: never
      children?: never
    }>,
  ): AuthoringDefinition<Id, ModelSchema, MessageSchema, undefined, Concrete>
}

/** An early Block identity for shared effects declared before typed contracts. */
export type Authoring<
  Id extends string,
  Concrete extends boolean = true,
> = Primitives<Id> &
  Readonly<{
    define: DefineContracts<Id, Concrete>
  }>

/** Defines a Block's local identity before specialized Model and Message contracts. */
export function define(
  id: '' | `${string}/${string}` | `${string}::${string}`,
): never
export function define<const Id extends string>(
  id: Id & (string extends Id ? never : unknown),
): Authoring<Id, true>
export function define<const Id extends string>(id: Id): Authoring<Id, false>
/** Defines one Block's identity, typed authoring helpers, and owned effect declarations. */
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
/** Defines one Block's identity, typed authoring helpers, and owned effect declarations. */
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
/** Defines one Block's identity, typed authoring helpers, and owned effect declarations. */
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
/** Defines one Block's identity, typed authoring helpers, and owned effect declarations. */
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
