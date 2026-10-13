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
  BindableBlock,
  Binding,
  BindingReturn,
  BindingRequirement,
  ValidateEmbeddedViewMounts,
} from './binding.js'
import { assertValidBindingStepNames } from './binding.js'
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

type KeyedBoundSteps<
  BlockValue extends BindableBlock,
  ParentModel,
  ParentMessage,
  Key extends InstanceKey,
  Placement extends string,
  Policy,
> = Readonly<{
  [Name in keyof BlockValue['steps']]: (
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
> = Omit<
  Binding<BlockValue, ParentModel, ParentMessage, Placement, Policy>,
  | 'init'
  | 'fold'
  | 'embedView'
  | 'subscriptions'
  | 'managedResources'
  | keyof BlockValue['steps']
> &
  Readonly<{
    /** @internal Distinguishes lifecycle services owned by dynamic instances. */
    __blockKeyedBinding: true
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
    subscriptions: Readonly<Record<never, never>>
    managedResources: Readonly<Record<never, never>>
    embedView: KeyedEmbed<BlockValue, ParentMessage, Placement, Key>
  }> &
  KeyedBoundSteps<
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

/** @internal Implements collection folding and embedding without constructing Layers. */
export const bindEach = <BlockValue extends BindableBlock>(
  block: BlockValue,
  config: any,
): any => {
  const placement = config.placement ?? block.owner.id
  assertSegment(placement)
  assertValidBindingStepNames(block.steps)
  const allowedIdentities = hostIdentitiesOf(block)
  const readAt = (model: any, key: InstanceKey) =>
    Option.map(
      Array.findFirst(
        config.readAll(model),
        (item: any) => config.key(item) === key,
      ),
      config.read,
    )
  const scopeReturn = (
    output: any,
    key: InstanceKey,
    isInitialization = false,
  ) =>
    output.commands === undefined
      ? output
      : Update.withOutMessage(
          {
            model: output.model,
            commands: output.commands.map((command: Command<any, any, any>) =>
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
  ) => ({
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
  const makeFold = (producer: (...args: ReadonlyArray<any>) => any) => {
    return (model: any, key: InstanceKey, ...args: ReadonlyArray<any>) => {
      assertRegisteredBinding(binding, placement)

      const fold = Update.foldChildAt({
        update: (
          model: any,
          input: Readonly<{ key: InstanceKey; args: ReadonlyArray<any> }>,
        ) =>
          scopeReturn(
            withOperationGraph(block.children, () =>
              producer(model, ...input.args),
            ),
            input.key,
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
                  config.outMessage.fold(
                    key,
                    outMessage,
                    liftContext(key, context, model),
                  ),
            }),
        ...(config.outMessage?.forward === undefined
          ? {}
          : {
              toParentOutMessage: (key: InstanceKey) => (outMessage: any) =>
                config.outMessage.forward(key, outMessage),
            }),
      } as never) as unknown as (
        model: any,
        key: InstanceKey,
        input: any,
      ) => any
      return fold(model, key, { key, args })
    }
  }
  const fold = makeFold(block.update)
  const steps = Record.map(block.steps, producer => {
    const foldStep = makeFold(producer)
    return (key: InstanceKey, ...args: ReadonlyArray<any>) =>
      (model: any) =>
        foldStep(model, key, ...args)
  })
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
    subscriptions: {},
    managedResources: {},
    mounts: block.mounts,
    EffectsLayer: qualifyLayer(
      placement,
      block.EffectsLayer as Layer.Layer<any, any, any>,
    ),
    embedView: (config_: any) => {
      const { key, ...embedConfig } = config_
      return {
        ...embedConfig,
        view: embedConfig.view ?? defaultViewOf(block),
        toParentMessage: (message: any) => config.toParentMessage(key, message),
        [ViewScopeTypeId]: {
          placement,
          binding,
          key,
          identity: { owner: block.owner, children: block.children },
        },
      }
    },
    ...steps,
  }
  registerBinding(binding, {
    block,
    select: model =>
      config.readAll(model).map((item: any) => ({
        key: config.key(item),
        model: config.read(item),
      })),
    toParentMessage: config.toParentMessage,
    subscriptionWhen: (model, key, name) => {
      const when = config.subscriptions?.when
      return typeof when === 'function'
        ? when(model, key)
        : (when?.[name]?.(model, key) ?? true)
    },
  })
  return binding
}
