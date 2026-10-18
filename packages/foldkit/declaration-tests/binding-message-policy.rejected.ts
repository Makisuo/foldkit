import { Option, Tuple } from 'effect'

import {
  ChildMessage,
  ContextChildBlock,
  type ContextConfig,
  type KeyedConfig,
  ParentDefinition,
  ParentMessage,
  ParentModel,
  type SilentConfig,
  type SilentKeyedConfig,
  contextConfig,
  keyedConfig,
  silentConfig,
  silentKeyedConfig,
} from './binding-message-policy.accepted.js'

const broadContextConfig: ContextConfig = contextConfig

// @ts-expect-error A broad parent Message union cannot prove one exact incoming owner.
ParentDefinition.bindChild(ContextChildBlock, broadContextConfig)

const missingIncomingRoute = {
  placement: 'child',
  read: (model: typeof ParentModel.Type) => Option.some(model.child),
  write: (model: typeof ParentModel.Type) => model,
  toParentMessage: (message: typeof ChildMessage.Type) =>
    ParentMessage.GotContextMessage({ roomId: 'room', message }),
  // @ts-expect-error A messageful public config requires an incoming route.
} satisfies ContextConfig

const disabledIncomingRoute = {
  placement: 'child',
  read: (model: typeof ParentModel.Type) => Option.some(model.child),
  write: (model: typeof ParentModel.Type) => model,
  toParentMessage: (message: typeof ChildMessage.Type) =>
    ParentMessage.GotContextMessage({ roomId: 'room', message }),
  // @ts-expect-error The manual routing opt-out is removed.
  fromParentMessage: false,
} satisfies ContextConfig

const wrongContextTuple = {
  ...contextConfig,
  fromParentMessage: {
    parentMessage: ParentMessage.GotContextMessage,
    // @ts-expect-error The native fold tuple includes the required context.
    args: (
      _model: typeof ParentModel.Type,
      { message }: ReturnType<typeof ParentMessage.GotContextMessage>,
    ) => Option.some(Tuple.make(message)),
  },
} satisfies ContextConfig

const wrongConstructorInput = {
  ...contextConfig,
  // @ts-expect-error The callback input must match the selected constructor.
  fromParentMessage: {
    parentMessage: ParentMessage.GotContextMessage,
    args: (
      _model: typeof ParentModel.Type,
      { message }: ReturnType<typeof ParentMessage.GotEntryMessage>,
    ) => Option.some(Tuple.make(message, { roomId: 'room' })),
  },
} satisfies ContextConfig

const wrongKeyTuple = {
  ...keyedConfig,
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    // @ts-expect-error The keyed native fold tuple begins with its string key.
    args: (
      _model: typeof ParentModel.Type,
      { message }: ReturnType<typeof ParentMessage.GotEntryMessage>,
    ) => Option.some(Tuple.make(1, message, { roomId: 'room' })),
  },
} satisfies KeyedConfig

const wrongKeyedConstructorInput = {
  ...keyedConfig,
  // @ts-expect-error A keyed route callback receives its selected wrapper.
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    args: (
      _model: typeof ParentModel.Type,
      { message }: ReturnType<typeof ParentMessage.GotContextMessage>,
    ) => Option.some(Tuple.make('entry', message, { roomId: 'room' })),
  },
} satisfies KeyedConfig

const mappedSilentConfig = {
  ...silentConfig,
  // @ts-expect-error A Message-free child cannot have an outgoing mapper.
  toParentMessage: () => ParentMessage.ClickedSave(),
} satisfies SilentConfig

const routedSilentConfig = {
  ...silentConfig,
  // @ts-expect-error A Message-free child cannot have an incoming route.
  fromParentMessage: {
    parentMessage: ParentMessage.GotContextMessage,
    args: () => Option.none(),
  },
} satisfies SilentConfig

const mappedSilentKeyedConfig = {
  ...silentKeyedConfig,
  // @ts-expect-error A keyed Message-free child cannot have an outgoing mapper.
  toParentMessage: () => ParentMessage.ClickedSave(),
} satisfies SilentKeyedConfig

const routedSilentKeyedConfig = {
  ...silentKeyedConfig,
  // @ts-expect-error A keyed Message-free child cannot have an incoming route.
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    args: () => Option.none(),
  },
} satisfies SilentKeyedConfig

void missingIncomingRoute
void disabledIncomingRoute
void wrongContextTuple
void wrongConstructorInput
void wrongKeyTuple
void wrongKeyedConstructorInput
void mappedSilentConfig
void routedSilentConfig
void mappedSilentKeyedConfig
void routedSilentKeyedConfig
