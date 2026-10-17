import { Option, Schema, Tuple } from 'effect'
import * as Block from 'foldkit/block'
import { defineMessageUnion } from 'foldkit/message'
import type { CallableTaggedStruct } from 'foldkit/schema'

export const ChildModel = Schema.Struct({ value: Schema.String })
export const ChildMessage = defineMessageUnion({
  ChangedValue: { value: Schema.String },
})
export type DispatchContext = Readonly<{ roomId: string }>

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ContextChildDefinition = Block.define(
  'BindingMessagePolicyContextChild',
  {
    Model: ChildModel,
    Message: ChildMessage,
  },
)
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ContextChildComposition = ContextChildDefinition.makeComposition()
export const ContextChildBlock = ContextChildComposition.makeBlock({
  init: ContextChildComposition.makeInit(() => ({
    model: ChildModel.make({ value: '' }),
  })),
  update: ContextChildComposition.makeUpdate(
    (model, _message, _context: DispatchContext) => ({ model }),
  ),
})

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const SilentChildDefinition = Block.define('BindingMessagePolicySilentChild', {
  Model: ChildModel,
  Message: Schema.Never,
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const SilentChildComposition = SilentChildDefinition.makeComposition()
export const SilentChildBlock = SilentChildComposition.makeBlock({
  init: SilentChildComposition.makeInit(() => ({
    model: ChildModel.make({ value: '' }),
  })),
  update: SilentChildComposition.makeUpdate(),
})

export const Entry = Schema.Struct({
  id: Schema.String,
  child: ChildModel,
})
export const ParentModel = Schema.Struct({
  child: ChildModel,
  silent: ChildModel,
  entries: Schema.Array(Entry),
  silentEntries: Schema.Array(Entry),
})
export const ParentMessage = defineMessageUnion({
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotContextMessage: { roomId: Schema.String, message: ChildMessage },
  // oxlint-disable-next-line foldkit/got-prefix-requires-block-payload -- This fixture deliberately probes reserved Got* routing with a nonstandard payload.
  GotEntryMessage: { id: Schema.String, message: ChildMessage },
  ClickedSave: {},
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
export const ParentDefinition = Block.define('BindingMessagePolicyParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

export type ContextConfig = Block.BindingConfig<
  typeof ContextChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'child'
>

type ContextParentMessageConstructor = CallableTaggedStruct<
  'GotContextMessage',
  Readonly<{ roomId: typeof Schema.String; message: typeof ChildMessage }>
>
const ContextParentMessage: ContextParentMessageConstructor =
  ParentMessage.GotContextMessage

export const contextConfig = {
  placement: 'child',
  read: (model: typeof ParentModel.Type) => Option.some(model.child),
  write: (model: typeof ParentModel.Type, _nextChild: typeof ChildModel.Type) =>
    model,
  toParentMessage: (
    message: typeof ChildMessage.Type,
  ): ReturnType<typeof ParentMessage.GotContextMessage> =>
    ParentMessage.GotContextMessage({ roomId: 'room', message }),
  fromParentMessage: {
    parentMessage: ContextParentMessage,
    args: (
      _model: typeof ParentModel.Type,
      { roomId, message }: ReturnType<typeof ParentMessage.GotContextMessage>,
    ): Option.Option<
      readonly [message: typeof ChildMessage.Type, context: DispatchContext]
    > => Option.some(Tuple.make(message, { roomId })),
  },
} satisfies ContextConfig

const ContextBinding = ParentDefinition.bindChild(
  ContextChildBlock,
  contextConfig,
)

export type KeyedConfig = Block.KeyedBindingConfig<
  typeof ContextChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  typeof Entry.Type,
  string,
  'entries'
>

type KeyedParentMessageConstructor = CallableTaggedStruct<
  'GotEntryMessage',
  Readonly<{ id: typeof Schema.String; message: typeof ChildMessage }>
>
const KeyedParentMessage: KeyedParentMessageConstructor =
  ParentMessage.GotEntryMessage

export const keyedConfig = {
  placement: 'entries',
  readAll: (model: typeof ParentModel.Type) => model.entries,
  key: (entry: typeof Entry.Type) => entry.id,
  read: (entry: typeof Entry.Type) => entry.child,
  writeAt: (
    model: typeof ParentModel.Type,
    _id: string,
    _nextChild: typeof ChildModel.Type,
  ) => model,
  toParentMessage: (
    id: string,
    message: typeof ChildMessage.Type,
  ): ReturnType<typeof ParentMessage.GotEntryMessage> =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: KeyedParentMessage,
    args: (
      _model: typeof ParentModel.Type,
      { id, message }: ReturnType<typeof ParentMessage.GotEntryMessage>,
    ): Option.Option<
      readonly [
        key: string,
        message: typeof ChildMessage.Type,
        context: DispatchContext,
      ]
    > => Option.some(Tuple.make(id, message, { roomId: id })),
  },
} satisfies KeyedConfig

const KeyedBinding = ParentDefinition.bindChild(ContextChildBlock, keyedConfig)

export type SilentConfig = Block.BindingConfig<
  typeof SilentChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'silent'
>

export const silentConfig = {
  placement: 'silent',
  read: (model: typeof ParentModel.Type) => Option.some(model.silent),
  write: (model: typeof ParentModel.Type, _nextChild: typeof ChildModel.Type) =>
    model,
} satisfies SilentConfig

const SilentBinding = ParentDefinition.bindChild(SilentChildBlock, silentConfig)

export type SilentKeyedConfig = Block.KeyedBindingConfig<
  typeof SilentChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  typeof Entry.Type,
  string,
  'silentEntries'
>

export const silentKeyedConfig = {
  placement: 'silentEntries',
  readAll: (model: typeof ParentModel.Type) => model.silentEntries,
  key: (entry: typeof Entry.Type) => entry.id,
  read: (entry: typeof Entry.Type) => entry.child,
  writeAt: (
    model: typeof ParentModel.Type,
    _id: string,
    _nextChild: typeof ChildModel.Type,
  ) => model,
} satisfies SilentKeyedConfig

const SilentKeyedBinding = ParentDefinition.bindChild(
  SilentChildBlock,
  silentKeyedConfig,
)

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct literal Block identity for type coverage.
const ParentComposition = ParentDefinition.makeComposition({
  childBindings: [
    ContextBinding,
    KeyedBinding,
    SilentBinding,
    SilentKeyedBinding,
  ],
})

ParentComposition.makeUpdate(model => ({ model }))
