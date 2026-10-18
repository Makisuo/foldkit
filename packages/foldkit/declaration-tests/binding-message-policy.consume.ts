import { Option } from 'effect'
import type * as Block from 'foldkit/block'

import {
  ChildMessage,
  ChildModel,
  ContextChildBlock,
  type ContextConfig,
  type DispatchContext,
  type KeyedConfig,
  ParentMessage,
  ParentModel,
  SilentChildBlock,
  type SilentConfig,
  type SilentKeyedConfig,
  contextConfig,
  keyedConfig,
  silentConfig,
  silentKeyedConfig,
} from './binding-message-policy.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value
type IsAny<Value> = 0 extends 1 & Value ? true : false
type IsUnknown<Value> =
  IsAny<Value> extends true
    ? false
    : unknown extends Value
      ? [keyof Value] extends [never]
        ? true
        : false
      : false

export type ContextBlockModelIsKnown = Expect<
  Equal<IsAny<typeof ContextChildBlock.Model.Type>, false>
>
export type ContextBlockModelIsNotUnknown = Expect<
  Equal<IsUnknown<typeof ContextChildBlock.Model.Type>, false>
>
export type ContextBlockModel = Expect<
  Equal<typeof ContextChildBlock.Model.Type, typeof ChildModel.Type>
>
export type ContextBlockMessageIsKnown = Expect<
  Equal<IsAny<typeof ContextChildBlock.Message.Type>, false>
>
export type ContextBlockMessageIsNotUnknown = Expect<
  Equal<IsUnknown<typeof ContextChildBlock.Message.Type>, false>
>
export type ContextBlockMessage = Expect<
  Equal<typeof ContextChildBlock.Message.Type, typeof ChildMessage.Type>
>
export type ContextUpdateArguments = Expect<
  Equal<
    Parameters<typeof ContextChildBlock.update>,
    [
      model: typeof ChildModel.Type,
      message: typeof ChildMessage.Type,
      context: DispatchContext,
    ]
  >
>
export type SilentBlockModelIsKnown = Expect<
  Equal<IsAny<typeof SilentChildBlock.Model.Type>, false>
>
export type SilentBlockModelIsNotUnknown = Expect<
  Equal<IsUnknown<typeof SilentChildBlock.Model.Type>, false>
>
export type SilentBlockModel = Expect<
  Equal<typeof SilentChildBlock.Model.Type, typeof ChildModel.Type>
>
export type SilentBlockMessageIsKnown = Expect<
  Equal<IsAny<typeof SilentChildBlock.Message.Type>, false>
>
export type SilentBlockMessageIsNotUnknown = Expect<
  Equal<IsUnknown<typeof SilentChildBlock.Message.Type>, false>
>
export type SilentBlockMessage = Expect<
  Equal<typeof SilentChildBlock.Message.Type, never>
>
export type SilentUpdateArguments = Expect<
  Equal<
    Parameters<typeof SilentChildBlock.update>,
    [model: typeof ChildModel.Type, message: never]
  >
>

const checkedContextConfig: ContextConfig = contextConfig
const checkedKeyedConfig: KeyedConfig = keyedConfig
const checkedSilentConfig: SilentConfig = silentConfig
const checkedSilentKeyedConfig: SilentKeyedConfig = silentKeyedConfig

export type ContextConstructorArguments = Expect<
  Equal<
    Parameters<typeof contextConfig.fromParentMessage.parentMessage>,
    Parameters<typeof ParentMessage.GotContextMessage>
  >
>
export type ContextConstructorOutput = Expect<
  Equal<
    ReturnType<typeof contextConfig.fromParentMessage.parentMessage>,
    ReturnType<typeof ParentMessage.GotContextMessage>
  >
>
export type ContextInput = Expect<
  Equal<
    Parameters<typeof contextConfig.fromParentMessage.args>[1],
    ReturnType<typeof ParentMessage.GotContextMessage>
  >
>
export type ContextOutput = Expect<
  Equal<
    ReturnType<typeof contextConfig.fromParentMessage.args>,
    Option.Option<
      readonly [message: typeof ChildMessage.Type, context: DispatchContext]
    >
  >
>
export type KeyedConstructorArguments = Expect<
  Equal<
    Parameters<typeof keyedConfig.fromParentMessage.parentMessage>,
    Parameters<typeof ParentMessage.GotEntryMessage>
  >
>
export type KeyedConstructorOutput = Expect<
  Equal<
    ReturnType<typeof keyedConfig.fromParentMessage.parentMessage>,
    ReturnType<typeof ParentMessage.GotEntryMessage>
  >
>
export type KeyedInput = Expect<
  Equal<
    Parameters<typeof keyedConfig.fromParentMessage.args>[1],
    ReturnType<typeof ParentMessage.GotEntryMessage>
  >
>
export type KeyedOutput = Expect<
  Equal<
    ReturnType<typeof keyedConfig.fromParentMessage.args>,
    Option.Option<
      readonly [
        key: string,
        message: typeof ChildMessage.Type,
        context: DispatchContext,
      ]
    >
  >
>
export type SilentMappingKeys = Expect<
  Equal<
    Extract<keyof typeof silentConfig, 'toParentMessage' | 'fromParentMessage'>,
    never
  >
>
export type SilentKeyedMappingKeys = Expect<
  Equal<
    Extract<
      keyof typeof silentKeyedConfig,
      'toParentMessage' | 'fromParentMessage'
    >,
    never
  >
>

const directContextTuple = contextConfig.fromParentMessage.args(
  ParentModel.make({
    child: { value: '' },
    silent: { value: '' },
    entries: [],
    silentEntries: [],
  }),
  ParentMessage.GotContextMessage({
    roomId: 'room',
    message: ChildMessage.ChangedValue({ value: 'next' }),
  }),
)
const expectedContextTuple: Option.Option<
  readonly [typeof ChildMessage.Type, DispatchContext]
> = directContextTuple

const directKeyedTuple = keyedConfig.fromParentMessage.args(
  ParentModel.make({
    child: { value: '' },
    silent: { value: '' },
    entries: [],
    silentEntries: [],
  }),
  ParentMessage.GotEntryMessage({
    id: 'entry',
    message: ChildMessage.ChangedValue({ value: 'next' }),
  }),
)
const expectedKeyedTuple: Option.Option<
  readonly [string, typeof ChildMessage.Type, DispatchContext]
> = directKeyedTuple

type PublicContextConfig = Block.BindingConfig<
  typeof ContextChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'child'
>
type PublicSilentConfig = Block.BindingConfig<
  typeof SilentChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'silent'
>

const publicContextConfig: PublicContextConfig = contextConfig
const publicSilentConfig: PublicSilentConfig = silentConfig

void checkedContextConfig
void checkedKeyedConfig
void checkedSilentConfig
void checkedSilentKeyedConfig
void expectedContextTuple
void expectedKeyedTuple
void publicContextConfig
void publicSilentConfig
