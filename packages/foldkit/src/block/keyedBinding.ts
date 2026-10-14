import { Array, Layer, Option, Record } from 'effect'

import { type Command, mapMessages } from '../command/index.js'
import type {
  AnyBlockView,
  BoundBlockConfig,
  BoundBlockFields,
  BoundBlockView,
} from '../html/block.js'
import * as Update from '../update/index.js'
import type {
  AnyBinding,
  BindableBlock,
  Binding,
  BindingEvidence,
  BindingRequirement,
  BindingReturn,
  ConnectionInspection,
  HandlerRequirementsOfBinding,
  ValidateEmbeddedViewMounts,
  WithoutBindingEvidence,
} from './binding.js'
import { assertValidConnectionOperationNames } from './binding.js'
import { registerBinding } from './composition.js'
import { type DefaultViewTypeId, defaultViewOf } from './defaultView.js'
import { ViewScopeTypeId, hostIdentitiesOf } from './identity.js'
import type { InstanceKey } from './instanceContext.js'
import {
  assertRegisteredBinding,
  withOperationGraph,
} from './operationGraph.js'
import type { ValidateConcreteComposition } from './requirements.js'
import { assertSegment, qualifyCommand, qualifyLayer } from './scope.js'

/** Handles and optionally forwards a keyed child's OutMessages at its parent. */
export type KeyedOutMessagePolicy<
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
  Key,
> =
  | Readonly<{
      fold: (
        key: Key,
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (model: ParentModel) => Readonly<{ model: ParentModel }>
      forward?: never
    }>
  | Readonly<{
      forward: (key: Key, outMessage: ChildOutMessage) => unknown | undefined
      fold?: (
        key: Key,
        outMessage: ChildOutMessage,
        context: Update.FoldContext<ChildMessage, ParentMessage, ParentModel>,
      ) => (model: ParentModel) => Readonly<{ model: ParentModel }>
    }>

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsUnknown<Value> =
  IsAny<Value> extends true ? false : unknown extends Value ? true : false

type Equal<Left, Right> = [Left, Right] extends [Right, Left] ? unknown : never

type ValidateKeyedFold<
  Fold,
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
  Key,
> = Fold extends (
  key: infer PolicyKey,
  outMessage: infer PolicyOutMessage,
  context: infer PolicyContext,
) => infer Step
  ? Equal<PolicyKey, Key> &
      Equal<PolicyOutMessage, ChildOutMessage> &
      (Update.FoldContext<
        ChildMessage,
        ParentMessage,
        ParentModel
      > extends PolicyContext
        ? unknown
        : never) &
      (Step extends (model: infer StepModel) => infer StepReturn
        ? Equal<StepModel, ParentModel> &
            (StepReturn extends Readonly<{ model: infer ReturnedModel }>
              ? Equal<ReturnedModel, ParentModel>
              : never)
        : never)
  : never

type ValidateKeyedForward<Forward, ChildOutMessage, Key> = Forward extends (
  key: infer PolicyKey,
  outMessage: infer PolicyOutMessage,
) => infer Forwarded
  ? Equal<PolicyKey, Key> &
      Equal<PolicyOutMessage, ChildOutMessage> &
      (IsAny<Forwarded> extends true
        ? never
        : IsUnknown<Forwarded> extends true
          ? never
          : [Forwarded] extends [void]
            ? never
            : [Exclude<Forwarded, undefined>] extends [never]
              ? never
              : unknown)
  : never

type ValidateKeyedPolicy<
  Policy,
  ParentModel,
  ChildMessage,
  ParentMessage,
  ChildOutMessage,
  Key,
> =
  Policy extends Readonly<{ fold: infer Fold }>
    ? Fold extends (key: any, outMessage: any, context: any) => any
      ? ValidateKeyedFold<
          Fold,
          ParentModel,
          ChildMessage,
          ParentMessage,
          ChildOutMessage,
          Key
        > &
          (Policy extends Readonly<{ forward: infer Forward }>
            ? ValidateKeyedForward<Forward, ChildOutMessage, Key>
            : unknown)
      : never
    : Policy extends Readonly<{ forward: infer Forward }>
      ? ValidateKeyedForward<Forward, ChildOutMessage, Key>
      : never

type KeyedBindingBaseConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Item,
  Key extends InstanceKey,
  Placement extends string,
> = Readonly<{
  placement?: Placement
  readAll: (model: ParentModel) => ReadonlyArray<Item>
  key: (item: Item) => Key
  read: (item: Item) => BlockValue['Model']['Type']
  writeAt: (
    model: ParentModel,
    key: Key,
    nextChildModel: BlockValue['Model']['Type'],
  ) => ParentModel
  toParentMessage: (
    key: Key,
    message: BlockValue['Message']['Type'],
  ) => ParentMessage
  subscriptions?: Readonly<{
    when?:
      | ((model: ParentModel, key: Key) => boolean)
      | Readonly<
          Partial<
            Record<
              keyof BlockValue['subscriptions'],
              (model: ParentModel, key: Key) => boolean
            >
          >
        >
  }>
}>

/** Declares a collection once, including its stable key and parent policies. */
export type KeyedBindingConfig<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Item,
  Key extends InstanceKey,
  Placement extends string,
  Policy = never,
> = KeyedBindingBaseConfig<
  BlockValue,
  ParentModel,
  ParentMessage,
  Item,
  Key,
  Placement
> &
  (BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
  }>
    ? Readonly<{ outMessage: Policy }> &
        ([Policy] extends [
          KeyedOutMessagePolicy<
            ParentModel,
            BlockValue['Message']['Type'],
            ParentMessage,
            ChildOutMessage,
            Key
          >,
        ]
          ? unknown
          : never)
    : Readonly<{ outMessage?: never }>)

type BlockId<BlockValue> =
  BlockValue extends Readonly<{
    owner: Readonly<{ id: infer Id extends string }>
  }>
    ? Id
    : never

type KeyedEmbed<
  BlockValue extends BindableBlock,
  ParentMessage,
  Placement extends string,
  Key,
> = {
  <View extends AnyBlockView>(
    config: Omit<BoundBlockFields<View, ParentMessage>, 'toParentMessage'> &
      Readonly<{ key: Key }> &
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
} & (BlockValue extends Readonly<{
  [DefaultViewTypeId]: infer View extends AnyBlockView
}>
  ? {
      (
        config: Omit<
          BoundBlockFields<View, ParentMessage>,
          'toParentMessage' | 'view'
        > &
          Readonly<{ key: Key; view?: View }>,
      ): BoundBlockConfig<
        BoundBlockView<View, BindingRequirement<Placement, BlockValue>>,
        ParentMessage
      >
    }
  : unknown)

type KeyedBoundExposedOperations<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Key extends InstanceKey,
  Placement extends string,
  Policy,
> = Readonly<{
  [Name in keyof BlockValue['expose']]: (
    key: Key,
    ...args: Parameters<
      Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>[Name]
    >
  ) => ReturnType<
    Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>[Name]
  >
}>

/** A registered collection whose active keys receive independent lifecycle scopes. */
export type KeyedBinding<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Key extends InstanceKey,
  Placement extends string,
  Policy,
> = WithoutBindingEvidence<
  Omit<
    Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>,
    'init' | 'fold' | 'embedView' | keyof BlockValue['expose']
  >
> &
  BindingEvidence<
    BlockValue,
    HandlerRequirementsOfBinding<
      Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>
    >,
    ConnectionInspection<
      Readonly<Record<never, never>>,
      Readonly<Record<never, never>>,
      BlockValue['mounts'],
      Layer.Layer<
        import('./scope.js').Qualify<
          Placement,
          Layer.Success<BlockValue['EffectsLayer']>
        >,
        Layer.Error<BlockValue['EffectsLayer']>,
        import('./scope.js').Qualify<
          Placement,
          Layer.Services<BlockValue['EffectsLayer']>
        >
      >
    >,
    true
  > &
  Readonly<{
    init: (
      key: Key,
      ...args: Parameters<BlockValue['init']>
    ) => ReturnType<
      Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>['init']
    >
    fold: (
      model: ParentModel,
      key: Key,
      ...args: Parameters<
        Binding<
          BlockValue,
          ParentModel,
          ParentMessage,
          Placement,
          Policy
        >['fold']
      > extends readonly [unknown, ...infer Args]
        ? Args
        : never
    ) => BindingReturn<
      ParentModel,
      ParentMessage,
      BlockValue['update'],
      Policy,
      Placement,
      BlockId<BlockValue>,
      BindingRequirement<Placement, BlockValue>
    >
    embedView: KeyedEmbed<BlockValue, ParentMessage, Placement, Key>
  }> &
  KeyedBoundExposedOperations<
    BlockValue,
    ParentModel,
    ParentMessage,
    Key,
    Placement,
    Policy
  >

/** Binds all occurrences of one Block through a single collection declaration. */
export type BindEach<BlockValue extends BindableBlock> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
  }>
    ? <
        ParentModel,
        Item,
        const KeyFunction extends (...args: ReadonlyArray<any>) => any,
        const ToParentMessage extends (...args: ReadonlyArray<any>) => any,
        const Policy,
        const Placement extends string = BlockId<BlockValue>,
      >(
        config: KeyedBindingBaseConfig<
          BlockValue,
          ParentModel,
          ReturnType<ToParentMessage>,
          Item,
          Extract<ReturnType<KeyFunction>, InstanceKey>,
          Placement
        > &
          Readonly<{
            key: KeyFunction
            toParentMessage: ToParentMessage
            outMessage: Policy
          }> &
          ValidateKeyedPolicy<
            Policy,
            NoInfer<ParentModel>,
            NoInfer<BlockValue['Message']['Type']>,
            NoInfer<ReturnType<ToParentMessage>>,
            NoInfer<ChildOutMessage>,
            NoInfer<Extract<ReturnType<KeyFunction>, InstanceKey>>
          > &
          ValidateConcreteComposition<BlockValue>,
      ) => KeyedBinding<
        BlockValue,
        ParentModel,
        ReturnType<ToParentMessage>,
        Extract<ReturnType<KeyFunction>, InstanceKey>,
        Placement,
        Policy
      >
    : <
        ParentModel,
        ParentMessage,
        Item,
        Key extends InstanceKey,
        const Placement extends string = BlockId<BlockValue>,
      >(
        config: KeyedBindingConfig<
          BlockValue,
          ParentModel,
          ParentMessage,
          Item,
          Key,
          Placement
        > &
          ValidateConcreteComposition<BlockValue>,
      ) => KeyedBinding<
        BlockValue,
        ParentModel,
        ParentMessage,
        Key,
        Placement,
        never
      >

type AnyUpdateReturn = Readonly<{
  model: any
  commands?: ReadonlyArray<Command<any, never, any>> | undefined
  outMessage?: any
}>

type AnyProducer = (model: any, ...args: ReadonlyArray<any>) => AnyUpdateReturn

type RuntimeKeyedFoldContext = Readonly<{
  modelBeforeUpdate: any
  liftCommand: (command: Command<any, any, any>) => Command<any, any, any>
  liftCommands: (
    commands: ReadonlyArray<Command<any, any, any>>,
  ) => ReadonlyArray<Command<any, any, any>>
}>

type RuntimeKeyedOutMessagePolicy = Readonly<{
  fold?: (
    key: InstanceKey,
    outMessage: any,
    context: RuntimeKeyedFoldContext,
  ) => (model: any) => AnyUpdateReturn
  forward?: (key: InstanceKey, outMessage: any) => any | undefined
}>

type RuntimeKeyedSubscriptionWhen =
  | ((model: any, key: InstanceKey) => boolean)
  | Readonly<
      globalThis.Record<
        string,
        ((model: any, key: InstanceKey) => boolean) | undefined
      >
    >

type RuntimeKeyedBindingConfig = Readonly<{
  placement?: string
  readAll: (model: any) => ReadonlyArray<any>
  key: (item: any) => InstanceKey
  read: (item: any) => any
  writeAt: (model: any, key: InstanceKey, nextChildModel: any) => any
  toParentMessage: (key: InstanceKey, message: any) => any
  subscriptions?: Readonly<{ when?: RuntimeKeyedSubscriptionWhen }>
  outMessage?: RuntimeKeyedOutMessagePolicy
}>

type RuntimeKeyedOperation = Readonly<{
  key: InstanceKey
  args: ReadonlyArray<any>
}>

type RuntimeKeyedChildFold = Readonly<{
  update: (childModel: any, operation: RuntimeKeyedOperation) => AnyUpdateReturn
  readAt: (model: any, key: InstanceKey) => Option.Option<any>
  writeAt: RuntimeKeyedBindingConfig['writeAt']
  toParentMessage: RuntimeKeyedBindingConfig['toParentMessage']
  foldOutMessage?: (
    key: InstanceKey,
    context: Update.FoldContext<any, any>,
  ) => (outMessage: any) => (model: any) => AnyUpdateReturn
  toParentOutMessage?: (
    key: InstanceKey,
  ) => (outMessage: any) => any | undefined
}>

type RuntimeKeyedFold = (
  model: any,
  key: InstanceKey,
  operation: RuntimeKeyedOperation,
) => AnyUpdateReturn

type RuntimeBoundKeyedFold = (
  model: any,
  key: InstanceKey,
  ...args: ReadonlyArray<any>
) => AnyUpdateReturn

/** @internal Implements collection folding and embedding without constructing Layers. */
export const bindEach = <const BlockValue extends BindableBlock>(
  block: BlockValue,
  config: RuntimeKeyedBindingConfig,
): AnyBinding => {
  const placement = config.placement ?? block.owner.id
  assertSegment(placement)
  assertValidConnectionOperationNames(block.expose)
  const allowedIdentities = hostIdentitiesOf(block)
  const readAt = (model: any, key: InstanceKey): Option.Option<any> =>
    Option.map(
      Array.findFirst(
        config.readAll(model),
        (item: any) => config.key(item) === key,
      ),
      config.read,
    )
  const scopeReturn = (
    output: AnyUpdateReturn,
    key: InstanceKey,
    isInitialization = false,
  ): AnyUpdateReturn =>
    output.commands === undefined
      ? output
      : Update.withOutMessage(
          {
            model: output.model,
            commands: output.commands.map(command =>
              qualifyCommand(
                placement,
                command,
                block.owner,
                {
                  binding,
                  key,
                  isInitialization,
                },
                allowedIdentities,
              ),
            ),
          },
          output.outMessage,
        )
  const liftContext = (
    key: InstanceKey,
    context: Update.FoldContext<any, any>,
    modelBeforeUpdate: any,
  ): RuntimeKeyedFoldContext => ({
    modelBeforeUpdate,
    liftCommand: (command: Command<any, any, any>) =>
      context.liftCommand(
        qualifyCommand(
          placement,
          command,
          block.owner,
          { binding, key },
          allowedIdentities,
        ),
      ),
    liftCommands: (commands: ReadonlyArray<Command<any, any, any>>) =>
      context.liftCommands(
        commands.map(command =>
          qualifyCommand(
            placement,
            command,
            block.owner,
            { binding, key },
            allowedIdentities,
          ),
        ),
      ),
  })
  const toChildFoldAt = (
    producer: AnyProducer,
    modelBeforeUpdate: any,
  ): RuntimeKeyedChildFold => ({
    update: (childModel, operation) =>
      scopeReturn(
        withOperationGraph(block.children, () =>
          producer(childModel, ...operation.args),
        ),
        operation.key,
      ),
    readAt,
    writeAt: config.writeAt,
    toParentMessage: config.toParentMessage,
    ...(config.outMessage?.fold === undefined
      ? {}
      : {
          foldOutMessage:
            (key: InstanceKey, context: Update.FoldContext<any, any>) =>
            (outMessage: any) =>
              config.outMessage!.fold!(
                key,
                outMessage,
                liftContext(key, context, modelBeforeUpdate),
              ),
        }),
    ...(config.outMessage?.forward === undefined
      ? {}
      : {
          toParentOutMessage: (key: InstanceKey) => (outMessage: any) =>
            config.outMessage!.forward!(key, outMessage),
        }),
  })
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const makeChildFoldAt = Update.foldChildAt as unknown as (
    childFold: RuntimeKeyedChildFold,
  ) => RuntimeKeyedFold
  const makeFold = (producer: AnyProducer): RuntimeBoundKeyedFold => {
    return (model, key, ...args) => {
      assertRegisteredBinding(binding, placement)

      return makeChildFoldAt(toChildFoldAt(producer, model))(model, key, {
        key,
        args,
      })
    }
  }
  const fold = makeFold(block.update)
  const exposedOperations = Record.map(block.expose, producer => {
    const foldStep = makeFold(producer)
    return (key: InstanceKey, ...args: ReadonlyArray<any>) =>
      (model: any) =>
        foldStep(model, key, ...args)
  })
  const requireKey = (key: InstanceKey | undefined): InstanceKey => {
    if (key === undefined) {
      throw new Error('[foldkit] Keyed Block bindings require an instance key.')
    }

    return key
  }
  const EffectsLayer = qualifyLayer(
    placement,
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    block.EffectsLayer as Layer.Layer<
      Layer.Success<BlockValue['EffectsLayer']>,
      Layer.Error<BlockValue['EffectsLayer']>,
      Layer.Services<BlockValue['EffectsLayer']>
    >,
  )
  const binding = {
    placement,
    init: (key: InstanceKey, ...args: ReadonlyArray<any>) => {
      assertRegisteredBinding(binding, placement)

      const childInit = scopeReturn(
        withOperationGraph(block.children, () => block.init(...args)),
        key,
        true,
      )
      return {
        model: childInit.model,
        commands: mapMessages(childInit.commands, message =>
          config.toParentMessage(key, message),
        ),
      }
    },
    fold,
    embedView: <View extends AnyBlockView>(
      embedConfig: Omit<
        BoundBlockFields<View, any>,
        'toParentMessage' | 'view'
      > &
        Readonly<{ key: InstanceKey; view?: View }>,
    ): BoundBlockConfig<View, any> => {
      const { key, ...fields } = embedConfig
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      const boundConfig = {
        ...fields,
        view: fields.view ?? defaultViewOf(block),
        toParentMessage: (message: any) => config.toParentMessage(key, message),
        [ViewScopeTypeId]: {
          placement,
          binding,
          key,
          identity: { owner: block.owner, children: block.children },
        },
      } as unknown as BoundBlockConfig<View, any>
      return boundConfig
    },
    ...exposedOperations,
  }
  registerBinding(binding, {
    block,
    select: model =>
      config.readAll(model).map((item: any) => ({
        key: config.key(item),
        model: config.read(item),
      })),
    toParentMessage: (key, message) =>
      config.toParentMessage(requireKey(key), message),
    subscriptionWhen: (model, key, name) => {
      const instanceKey = requireKey(key)
      const when = config.subscriptions?.when
      if (typeof when === 'function') {
        return when(model, instanceKey)
      }
      return when?.[name]?.(model, instanceKey) ?? true
    },
    inspection: {
      subscriptions: {},
      managedResources: {},
      mounts: block.mounts,
      EffectsLayer,
    },
  })
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  return binding as unknown as AnyBinding
}
