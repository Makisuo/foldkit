import { Predicate, type Schema } from 'effect'

import type * as Update from '../update/index.js'
import {
  type BindableBlock,
  type Binding,
  type BindingBaseConfig,
  type MessageMapping,
  bind,
} from './binding.js'
import { registerBindingParentContract } from './composition.js'
import {
  type RequiredDirectField,
  normalizeConnectionConfig,
} from './directConnection.js'
import type { InstanceKey } from './instanceContext.js'
import {
  type KeyedBinding,
  type KeyedBindingBaseConfig,
  bindEach,
} from './keyedBinding.js'
import type { ValidateConcreteComposition } from './requirements.js'

type AnySchema = Schema.Codec<any, any, any, any>

type BlockId<BlockValue> =
  BlockValue extends Readonly<{
    owner: Readonly<{ id: infer Id extends string }>
  }>
    ? Id
    : never

type ReturnOf<Value> = Value extends (
  ...args: ReadonlyArray<never>
) => infer Output
  ? Output
  : never

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false

type ValidateParentMessageMapping<Mapper, ParentMessage> =
  IsAny<ReturnOf<Mapper>> extends true
    ? never
    : IsUnknown<ReturnOf<Mapper>> extends true
      ? never
      : [ReturnOf<Mapper>] extends [ParentMessage]
        ? unknown
        : never

type ParentOutMessage<ParentOutMessageSchema> =
  ParentOutMessageSchema extends AnySchema
    ? ParentOutMessageSchema['Type']
    : never

type PolicyStepReturn<ParentModel, ParentMessage, ParentOutMessageValue> =
  Readonly<{
    model: ParentModel
    commands?: Update.Commands<ParentMessage, any> | undefined
    outMessage?: ParentOutMessageValue
  }>

type ParentOwnedOutMessagePolicy<
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
  ParentOutMessageValue,
> =
  | Readonly<{
      fold: (
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (
        model: ParentModel,
      ) => PolicyStepReturn<ParentModel, ParentMessage, ParentOutMessageValue>
      forward?: never
    }>
  | ([ParentOutMessageValue] extends [never]
      ? never
      : Readonly<{
          forward: (
            outMessage: ChildOutMessage,
          ) => ParentOutMessageValue | undefined
          fold?: (
            outMessage: ChildOutMessage,
            context: Update.FoldContext<
              ChildMessage,
              ParentMessage,
              ParentModel
            >,
          ) => (
            model: ParentModel,
          ) => PolicyStepReturn<
            ParentModel,
            ParentMessage,
            ParentOutMessageValue
          >
        }>)

type ParentOwnedKeyedOutMessagePolicy<
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
  ParentOutMessageValue,
  Key,
> =
  | Readonly<{
      fold: (
        key: Key,
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (
        model: ParentModel,
      ) => PolicyStepReturn<ParentModel, ParentMessage, ParentOutMessageValue>
      forward?: never
    }>
  | ([ParentOutMessageValue] extends [never]
      ? never
      : Readonly<{
          forward: (
            key: Key,
            outMessage: ChildOutMessage,
          ) => ParentOutMessageValue | undefined
          fold?: (
            key: Key,
            outMessage: ChildOutMessage,
            context: Update.FoldContext<
              ChildMessage,
              ParentMessage,
              ParentModel
            >,
          ) => (
            model: ParentModel,
          ) => PolicyStepReturn<
            ParentModel,
            ParentMessage,
            ParentOutMessageValue
          >
        }>)

type StaticOutMessageConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  ParentOutMessageValue,
  Policy,
> = Readonly<{
  outMessage: Policy &
    NoInfer<
      ParentOwnedOutMessagePolicy<
        ParentModel,
        BlockValue['Message']['Type'],
        ParentMessage,
        BlockValue extends Readonly<{
          OutMessage: Readonly<{ Type: infer ChildOutMessage }>
        }>
          ? ChildOutMessage
          : never,
        ParentOutMessageValue
      >
    >
}> &
  (BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? unknown
    : never)

type NoStaticOutMessageConfig<BlockValue> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? never
    : Readonly<{ outMessage?: never }>

type DirectChildConfig<
  BlockValue extends BindableBlock,
  ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>,
  ParentMessage,
  Mapper,
  Field extends RequiredDirectField<
    ParentModelSchema['Type'],
    BlockValue['Model']['Type']
  >,
  Placement extends string,
> = Omit<
  BindingBaseConfig<
    BlockValue,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    Placement
  >,
  'read' | 'write' | 'toParentMessage' | 'parentMessage'
> &
  Readonly<{
    field: Field
    read?: never
    write?: never
  }> &
  MessageMapping<BlockValue, Mapper> &
  ValidateParentMessageMapping<Mapper, ParentMessage> &
  ValidateConcreteComposition<BlockValue>

type AccessorChildConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Mapper,
  Placement extends string,
> = Omit<
  BindingBaseConfig<BlockValue, ParentModel, ReturnOf<Mapper>, Placement>,
  'toParentMessage' | 'parentMessage'
> &
  MessageMapping<BlockValue, Mapper> &
  ValidateParentMessageMapping<Mapper, ParentMessage> &
  ValidateConcreteComposition<BlockValue>

type PolicyOf<BlockValue, Policy> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? Policy
    : never

/** Creates child Bindings in an established parent Model and Message context. */
export interface BindChild<
  ParentModelSchema extends AnySchema,
  ParentMessageSchema extends AnySchema,
  ParentOutMessageSchema extends AnySchema | undefined = undefined,
> {
  <
    const BlockValue extends BindableBlock,
    Item,
    const Key extends InstanceKey,
    const Policy,
    const Placement extends string = BlockId<BlockValue>,
  >(
    block: BlockValue,
    config: KeyedBindingBaseConfig<
      BlockValue,
      ParentModelSchema['Type'],
      ParentMessageSchema['Type'],
      Item,
      Key,
      Placement
    > &
      Readonly<{
        outMessage: Policy &
          NoInfer<
            ParentOwnedKeyedOutMessagePolicy<
              ParentModelSchema['Type'],
              BlockValue['Message']['Type'],
              ParentMessageSchema['Type'],
              BlockValue extends Readonly<{
                OutMessage: Readonly<{ Type: infer ChildOutMessage }>
              }>
                ? ChildOutMessage
                : never,
              ParentOutMessage<ParentOutMessageSchema>,
              Key
            >
          >
      }> &
      ValidateConcreteComposition<BlockValue>,
  ): KeyedBinding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    Key,
    Placement,
    PolicyOf<BlockValue, Policy>,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    ParentOutMessage<ParentOutMessageSchema>
  >
  <
    const BlockValue extends BindableBlock,
    Item,
    const Key extends InstanceKey,
    const Placement extends string = BlockId<BlockValue>,
  >(
    block: BlockValue,
    config: BlockValue extends Readonly<{
      OutMessage: Readonly<{ Type: unknown }>
    }>
      ? never
      : KeyedBindingBaseConfig<
          BlockValue,
          ParentModelSchema['Type'],
          ParentMessageSchema['Type'],
          Item,
          Key,
          Placement
        > &
          Readonly<{
            outMessage?: never
          }> &
          ValidateConcreteComposition<BlockValue>,
  ): KeyedBinding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    Key,
    Placement,
    never,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    ParentOutMessage<ParentOutMessageSchema>
  >
  <
    const BlockValue extends BindableBlock,
    const Mapper,
    const Field extends RequiredDirectField<
      ParentModelSchema['Type'],
      BlockValue['Model']['Type']
    >,
    const Policy,
    const Placement extends string = Field,
  >(
    block: BlockValue,
    config: ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>
      ? DirectChildConfig<
          BlockValue,
          ParentModelSchema,
          ParentMessageSchema['Type'],
          Mapper,
          Field,
          Placement
        > &
          StaticOutMessageConfig<
            BlockValue,
            ParentModelSchema['Type'],
            ParentMessageSchema['Type'],
            ParentOutMessage<ParentOutMessageSchema>,
            Policy
          >
      : never,
  ): Binding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    Placement,
    Policy,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    ParentOutMessage<ParentOutMessageSchema>
  >
  <
    const BlockValue extends BindableBlock,
    const Mapper,
    const Field extends RequiredDirectField<
      ParentModelSchema['Type'],
      BlockValue['Model']['Type']
    >,
    const Placement extends string = Field,
  >(
    block: BlockValue,
    config: ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>
      ? DirectChildConfig<
          BlockValue,
          ParentModelSchema,
          ParentMessageSchema['Type'],
          Mapper,
          Field,
          Placement
        > &
          NoStaticOutMessageConfig<BlockValue>
      : never,
  ): Binding<
    BlockValue,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    Placement,
    never,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    ParentOutMessage<ParentOutMessageSchema>
  >
  <
    const BlockValue extends BindableBlock,
    const Mapper,
    const Policy,
    const Placement extends string = BlockId<BlockValue>,
  >(
    block: BlockValue,
    config: AccessorChildConfig<
      BlockValue,
      ParentModelSchema['Type'],
      ParentMessageSchema['Type'],
      Mapper,
      Placement
    > &
      StaticOutMessageConfig<
        BlockValue,
        ParentModelSchema['Type'],
        ParentMessageSchema['Type'],
        ParentOutMessage<ParentOutMessageSchema>,
        Policy
      >,
  ): Binding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    Placement,
    Policy,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    ParentOutMessage<ParentOutMessageSchema>
  >
  <
    const BlockValue extends BindableBlock,
    const Mapper,
    const Placement extends string = BlockId<BlockValue>,
  >(
    block: BlockValue,
    config: AccessorChildConfig<
      BlockValue,
      ParentModelSchema['Type'],
      ParentMessageSchema['Type'],
      Mapper,
      Placement
    > &
      NoStaticOutMessageConfig<BlockValue>,
  ): Binding<
    BlockValue,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    Placement,
    never,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    ParentOutMessage<ParentOutMessageSchema>
  >
}

/** @internal Creates a parent-owned Binding constructor and records its exact parent contract. */
export const makeBindChild = <
  ParentModelSchema extends AnySchema,
  ParentMessageSchema extends AnySchema,
  ParentOutMessageSchema extends AnySchema | undefined = undefined,
>(
  parentContract: Readonly<{
    ownerToken: object
    Model: ParentModelSchema
    Message: ParentMessageSchema
    OutMessage: ParentOutMessageSchema
  }>,
): BindChild<ParentModelSchema, ParentMessageSchema, ParentOutMessageSchema> =>
  ((block: BindableBlock, config: unknown) => {
    if (Predicate.isObject(config) && Object.hasOwn(config, 'readAll')) {
      const binding = bindEach(block, config as never)
      registerBindingParentContract(binding, parentContract)
      return Object.freeze(binding)
    }

    const normalized =
      Predicate.isObject(config) && Object.hasOwn(config, 'field')
        ? normalizeConnectionConfig({ ...config, Model: parentContract.Model })
        : normalizeConnectionConfig(config)

    const binding = bind(block, normalized as never)
    registerBindingParentContract(binding, parentContract)
    return Object.freeze(binding)
  }) as BindChild<
    ParentModelSchema,
    ParentMessageSchema,
    ParentOutMessageSchema
  >
