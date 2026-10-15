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
  type DirectField,
  normalizeConnectionConfig,
} from './directConnection.js'
import type { InstanceKey } from './instanceContext.js'
import {
  type KeyedBinding,
  type KeyedBindingBaseConfig,
  bindEach,
} from './keyedBinding.js'
import {
  type KeyAt,
  type KeyedFieldConfig,
  isKeyedFieldStorage,
  normalizeKeyedFieldConfig,
} from './keyedFieldConnection.js'
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
  /** Handles every child OutMessage locally, forwards selected variants into
   * the parent's OutMessage union, or does both. */
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

type NoOutMessageConfig<BlockValue> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? never
    : Readonly<{ outMessage?: never }>

type GeneralKeyedConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Item,
  Key extends InstanceKey,
  Placement extends string,
> = KeyedBindingBaseConfig<
  BlockValue,
  ParentModel,
  ParentMessage,
  Item,
  Key,
  Placement
> &
  Readonly<{
    field?: never
    presentWhen?: never
    parentMessage?: never
  }>

type ExactGeneralKeyedConfig<Config> = Readonly<{
  [
    Field in Exclude<
      keyof Config,
      keyof GeneralKeyedConfig<any, any, any, any, any, any> | 'outMessage'
    >
  ]: never
}>

type DirectChildConfig<
  BlockValue extends BindableBlock,
  ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>,
  ParentMessage,
  Mapper,
  Field extends DirectField<
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
    /** Selects an exact child Model or Option child Model stored in a required
     * parent Struct field. None makes the child absent; folds never create it.
     * Placement defaults to this storage field name. */
    field: Field
    Model?: never
    ChildModel?: never
    /** Makes the whole occurrence absent when false. This stops its lifecycle
     * work and ignores folds and exposed operations without deleting stored
     * state. subscriptions.when gates only Subscription Streams. */
    presentWhen?: (model: NoInfer<ParentModelSchema['Type']>) => boolean
    read?: never
    write?: never
    readAll?: never
    writeAt?: never
    key?: never
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
  ValidateConcreteComposition<BlockValue> &
  Readonly<{
    Model?: never
    ChildModel?: never
    field?: never
    presentWhen?: never
    readAll?: never
    key?: never
    writeAt?: never
  }>

type KeyedFieldOutMessageConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  ParentOutMessageValue,
  Key extends InstanceKey,
  Policy,
> = Readonly<{
  /** Handles every keyed child OutMessage locally, forwards selected variants
   * into the parent's OutMessage union, or does both. */
  outMessage?: Policy &
    NoInfer<
      ParentOwnedKeyedOutMessagePolicy<
        ParentModel,
        BlockValue['Message']['Type'],
        ParentMessage,
        BlockValue extends Readonly<{
          OutMessage: Readonly<{ Type: infer ChildOutMessage }>
        }>
          ? ChildOutMessage
          : never,
        ParentOutMessageValue,
        Key
      >
    >
}> &
  (BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? Readonly<{
        /** Handles every keyed child OutMessage locally, forwards selected
         * variants into the parent's OutMessage union, or does both. */
        outMessage: unknown
      }>
    : NoOutMessageConfig<BlockValue>)

type PolicyOf<BlockValue, Policy> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: unknown }>
  }>
    ? Policy
    : never

/** Creates a static, optional, or keyed child Binding in this Definition's
 * parent Model, Message, and OutMessage context.
 *
 * Register the returned Binding in the same Definition's Composition. A
 * Binding created by another Definition is rejected even when its structural
 * Model and Message types happen to match. Creating the Binding records passive
 * composition policy; a Runtime starts its lifecycle work later. */
export interface BindChild<
  ParentModelSchema extends AnySchema,
  ParentMessageSchema extends AnySchema,
  ParentOutMessageSchema extends AnySchema | undefined = undefined,
> {
  <
    const BlockValue extends BindableBlock,
    const Mapper,
    const Field extends DirectField<
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
          (BlockValue extends Readonly<{
            OutMessage: Readonly<{ Type: unknown }>
          }>
            ? StaticOutMessageConfig<
                BlockValue,
                ParentModelSchema['Type'],
                ParentMessageSchema['Type'],
                ParentOutMessage<ParentOutMessageSchema>,
                Policy
              >
            : NoOutMessageConfig<BlockValue>)
      : never,
  ): Binding<
    BlockValue,
    ParentModelSchema['Type'],
    BlockValue extends Readonly<{
      OutMessage: Readonly<{ Type: unknown }>
    }>
      ? ParentMessageSchema['Type']
      : ReturnOf<Mapper>,
    Placement,
    PolicyOf<BlockValue, Policy>,
    ParentModelSchema['Type'],
    BlockValue extends Readonly<{
      OutMessage: Readonly<{ Type: unknown }>
    }>
      ? ParentMessageSchema['Type']
      : ReturnOf<Mapper>,
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
      NoOutMessageConfig<BlockValue>,
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
    const Field extends keyof ParentModelSchema['Type'] & string,
    const KeyField extends keyof BlockValue['Model']['Type'] & string,
    const Policy,
    const Placement extends string = Field,
  >(
    block: BlockValue,
    config: ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>
      ? KeyedFieldConfig<
          BlockValue,
          ParentModelSchema,
          ParentMessageSchema['Type'],
          Mapper,
          Field,
          KeyField,
          Placement
        > &
          KeyedFieldOutMessageConfig<
            BlockValue,
            ParentModelSchema['Type'],
            ParentMessageSchema['Type'],
            ParentOutMessage<ParentOutMessageSchema>,
            KeyAt<BlockValue['Model']['Type'], KeyField>,
            Policy
          >
      : never,
  ): KeyedBinding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    KeyAt<BlockValue['Model']['Type'], KeyField>,
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
    config: GeneralKeyedConfig<
      BlockValue,
      ParentModelSchema['Type'],
      ParentMessageSchema['Type'],
      Item,
      Key,
      Placement
    > &
      NoOutMessageConfig<BlockValue> &
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
    Item,
    const Key extends InstanceKey,
    const Config extends Readonly<{
      outMessage: ParentOwnedKeyedOutMessagePolicy<
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
    }>,
    const Placement extends string = BlockId<BlockValue>,
  >(
    block: BlockValue,
    config: GeneralKeyedConfig<
      BlockValue,
      ParentModelSchema['Type'],
      ParentMessageSchema['Type'],
      Item,
      Key,
      Placement
    > &
      Readonly<{
        /** Handles every keyed child OutMessage locally, forwards selected
         * variants into the parent's OutMessage union, or does both. */
        outMessage: ParentOwnedKeyedOutMessagePolicy<
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
      }> &
      Config &
      NoInfer<ExactGeneralKeyedConfig<Config>> &
      ValidateConcreteComposition<BlockValue>,
  ): KeyedBinding<
    BlockValue,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    Key,
    Placement,
    PolicyOf<BlockValue, Config['outMessage']>,
    ParentModelSchema['Type'],
    ParentMessageSchema['Type'],
    ParentOutMessage<ParentOutMessageSchema>
  >
}

const assertGeneralKeyedConfig = (config: object): void => {
  const allowedFields = new Set([
    'placement',
    'readAll',
    'key',
    'read',
    'writeAt',
    'toParentMessage',
    'subscriptions',
    'outMessage',
    'field',
    'presentWhen',
    'parentMessage',
  ])
  for (const configField of Reflect.ownKeys(config)) {
    if (!Predicate.isString(configField) || !allowedFields.has(configField)) {
      throw new Error(
        `[foldkit] A general keyed Binding does not support the config field "${globalThis.String(configField)}".`,
      )
    }
  }

  for (const forbiddenField of ['field', 'presentWhen', 'parentMessage']) {
    if (Object.hasOwn(config, forbiddenField)) {
      throw new Error(
        '[foldkit] A general keyed Binding cannot supply field, presentWhen, or parentMessage.',
      )
    }
  }

  for (const functionField of [
    'readAll',
    'key',
    'read',
    'writeAt',
    'toParentMessage',
  ]) {
    if (!Predicate.isFunction(Reflect.get(config, functionField))) {
      throw new Error(
        `[foldkit] A general keyed Binding requires a ${functionField} function.`,
      )
    }
  }
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
    if (Predicate.isObject(config) && Object.hasOwn(config, 'field')) {
      for (const field of ['Model', 'ChildModel']) {
        if (Object.hasOwn(config, field)) {
          throw new Error(
            `[foldkit] A parent-owned field Binding cannot supply ${field}; its Definition and child Block establish the Model contracts.`,
          )
        }
      }
    }

    if (Predicate.isObject(config) && Object.hasOwn(config, 'readAll')) {
      assertGeneralKeyedConfig(config)

      const binding = bindEach(block, config as never)
      registerBindingParentContract(binding, parentContract)
      return Object.freeze(binding)
    }

    if (
      Predicate.isObject(config) &&
      Object.hasOwn(config, 'field') &&
      (Object.hasOwn(config, 'key') ||
        isKeyedFieldStorage(
          parentContract.Model,
          block.Model,
          Reflect.get(config, 'field'),
        ))
    ) {
      const normalized = normalizeKeyedFieldConfig({
        ...config,
        Model: parentContract.Model,
        ChildModel: block.Model,
      })
      const binding = bindEach(block, normalized as never)
      registerBindingParentContract(binding, parentContract)
      return Object.freeze(binding)
    }

    const normalized =
      Predicate.isObject(config) && Object.hasOwn(config, 'field')
        ? normalizeConnectionConfig(
            { ...config, Model: parentContract.Model },
            block.Model,
            block.Message,
            parentContract.Message,
          )
        : normalizeConnectionConfig(
            config,
            block.Model,
            block.Message,
            parentContract.Message,
          )

    const binding = bind(block, normalized as never)
    registerBindingParentContract(binding, parentContract)
    return Object.freeze(binding)
  }) as BindChild<
    ParentModelSchema,
    ParentMessageSchema,
    ParentOutMessageSchema
  >
