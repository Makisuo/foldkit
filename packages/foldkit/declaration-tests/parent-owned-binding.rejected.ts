import { Layer, Option, Schema } from 'effect'

import { defineApplication, Block, Message } from '../src/index.js'
import {
  ChildBlock,
  ParentOutMessage,
  PlainChildBlock,
} from './parent-owned-binding.accepted.js'

const NamedEntry = Schema.Struct({
  id: Schema.String,
  child: PlainChildBlock.Model,
})
const ParentModel = Schema.Struct({
  child: ChildBlock.Model,
  maybeChild: Schema.Option(ChildBlock.Model),
  entries: Schema.Array(
    Schema.Struct({ id: Schema.Number, child: ChildBlock.Model }),
  ),
  namedEntries: Schema.Array(NamedEntry),
})
const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildBlock.Message },
  GotEntryMessage: { id: Schema.Number, message: ChildBlock.Message },
  GotNamedEntryMessage: { id: Schema.String, message: PlainChildBlock.Message },
  ForeignMessage: {},
})
const Parent = Block.define('DeclarationRejectedParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const unregisteredChild = Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: () => model => ({ model }) },
})

type ChildPolicy = Block.OutMessagePolicy<
  typeof ParentModel.Type,
  typeof ChildBlock.Message.Type,
  typeof ParentMessage.Type,
  typeof ChildBlock.OutMessage.Type
>
type ChildConfig = Block.BindingConfig<
  typeof ChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'child',
  ChildPolicy
>
type PlainChildConfig = Block.BindingConfig<
  typeof PlainChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  'plainChild'
>
const childPolicy: ChildPolicy = {
  fold: () => model => ({ model }),
}

// @ts-expect-error A child with OutMessages requires an OutMessage policy.
const missingChildPolicy: ChildConfig = {
  placement: 'child',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
}
const forbiddenPlainChildPolicy: PlainChildConfig = {
  placement: 'plainChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  // @ts-expect-error A child without OutMessages forbids an OutMessage policy.
  outMessage: childPolicy,
}
// @ts-expect-error An absent OutMessage policy must be omitted, not undefined.
const undefinedPlainChildPolicy: PlainChildConfig = {
  placement: 'plainChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  outMessage: undefined,
}

void missingChildPolicy
void forbiddenPlainChildPolicy
void undefinedPlainChildPolicy

const Forwarding = Block.define('DeclarationRejectedForwarding', {
  Model: ParentModel,
  Message: ParentMessage,
  OutMessage: ParentOutMessage,
})
Forwarding.bindChild(ChildBlock, {
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  field: 'child',
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    forward: (_outMessage: typeof ChildBlock.OutMessage.Type) =>
      ChildBlock.OutMessage.SelectedValue({ value: 'foreign' }),
  },
})

Parent.bindChild(ChildBlock, {
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  field: 'child',
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  parentMessage: ParentMessage.GotEntryMessage,
})

Parent.bindChild(ChildBlock, {
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  field: 'child',
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  toParentMessage: () => ({ _tag: 'OutsideParentMessage' }),
})

Parent.bindChild(ChildBlock, {
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  field: 'child',
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  parentMessage: ParentMessage.GotChildMessage,
  toParentMessage: () =>
    ParentMessage.GotChildMessage({
      message: ChildBlock.Message.UpdatedValue({ value: 'next' }),
    }),
})

Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  key: entry => ({ id: entry.id }),
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) =>
    ParentMessage.GotEntryMessage({ id: 0, message }),
  outMessage: { fold: () => model => ({ model }) },
})

const writeAtNumberKey = (
  model: typeof ParentModel.Type,
  _id: number,
  _nextChild: typeof PlainChildBlock.Model.Type,
) => model
const toParentMessageWithNumberKey = (
  _id: number,
  message: typeof PlainChildBlock.Message.Type,
) => ParentMessage.GotNamedEntryMessage({ id: 'first', message })
const readNamedEntries = (model: typeof ParentModel.Type) => model.namedEntries
const namedEntryKey = (entry: typeof NamedEntry.Type) => entry.id
const readNamedEntry = (entry: typeof NamedEntry.Type) => entry.child
const writeAtStringKey = (
  model: typeof ParentModel.Type,
  _id: string,
  _nextChild: typeof PlainChildBlock.Model.Type,
) => model
const toParentMessageWithStringKey = (
  id: string,
  message: typeof PlainChildBlock.Message.Type,
) => ParentMessage.GotNamedEntryMessage({ id, message })
const whenNamedEntryWithNumberKey = (
  _model: typeof ParentModel.Type,
  _id: number,
) => true

type NamedKeyedConfig = Block.KeyedBindingConfig<
  typeof PlainChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  typeof NamedEntry.Type,
  string,
  'namedEntries'
>

type KeyedChildPolicy = Block.KeyedOutMessagePolicy<
  typeof ParentModel.Type,
  typeof ChildBlock.Message.Type,
  typeof ParentMessage.Type,
  typeof ChildBlock.OutMessage.Type,
  number
>
type KeyedChildConfig = Block.KeyedBindingConfig<
  typeof ChildBlock,
  typeof ParentModel.Type,
  typeof ParentMessage.Type,
  Readonly<{
    id: number
    child: typeof ChildBlock.Model.Type
  }>,
  number,
  'entries',
  KeyedChildPolicy
>

// @ts-expect-error A keyed child with OutMessages requires an OutMessage policy.
const missingKeyedChildPolicy: KeyedChildConfig = {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
}
const forbiddenPlainKeyedPolicy: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  key: namedEntryKey,
  read: readNamedEntry,
  writeAt: writeAtStringKey,
  toParentMessage: toParentMessageWithStringKey,
  // @ts-expect-error A keyed child without OutMessages forbids an OutMessage policy.
  outMessage: childPolicy,
}
// @ts-expect-error An absent keyed OutMessage policy must be omitted, not undefined.
const undefinedPlainKeyedPolicy: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  key: namedEntryKey,
  read: readNamedEntry,
  writeAt: writeAtStringKey,
  toParentMessage: toParentMessageWithStringKey,
  outMessage: undefined,
}

void missingKeyedChildPolicy
void forbiddenPlainKeyedPolicy
void undefinedPlainKeyedPolicy

const unstableKey: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  // @ts-expect-error No-OutMessage keyed Binding keys are also stable primitive instance keys.
  key: entry => ({ id: entry.id }),
  read: readNamedEntry,
  writeAt: writeAtStringKey,
  toParentMessage: toParentMessageWithStringKey,
}

const wrongWriteAtKey: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  key: namedEntryKey,
  read: readNamedEntry,
  // @ts-expect-error writeAt receives the exact string returned by key.
  writeAt: writeAtNumberKey,
  toParentMessage: toParentMessageWithStringKey,
}

const wrongParentMessageKey: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  key: namedEntryKey,
  read: readNamedEntry,
  writeAt: writeAtStringKey,
  // @ts-expect-error toParentMessage receives the exact string returned by key.
  toParentMessage: toParentMessageWithNumberKey,
}

void unstableKey
void wrongWriteAtKey
void wrongParentMessageKey

const wrongSubscriptionKey: NamedKeyedConfig = {
  placement: 'namedEntries',
  readAll: readNamedEntries,
  key: namedEntryKey,
  read: readNamedEntry,
  writeAt: writeAtStringKey,
  toParentMessage: toParentMessageWithStringKey,
  // @ts-expect-error A keyed Subscription gate receives the exact string returned by key.
  subscriptions: { when: whenNamedEntryWithNumberKey },
}

Parent.bindChild(PlainChildBlock, wrongSubscriptionKey)

// @ts-expect-error A Definition cannot complete before toComposition.
Parent.toBlock
// @ts-expect-error The breaking staging API has no register alias.
Parent.register
// @ts-expect-error A completed child has no child-owned Binding factory.
ChildBlock.connection
// @ts-expect-error Keyed Bindings are also created by the parent.
ChildBlock.keyedConnection

Parent.toComposition().toBlock({
  init: () => ({
    model: ParentModel.make({
      child: ChildBlock.Model.make({ value: 'initial' }),
      maybeChild: Option.none(),
      entries: [],
      namedEntries: [],
    }),
  }),
  update: Parent.update((model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => unregisteredChild.fold(model, message),
      GotEntryMessage: () => ({ model }),
      GotNamedEntryMessage: () => ({ model }),
      ForeignMessage: () => ({ model }),
    }),
  ),
  // @ts-expect-error Child operations require registration in the Composition.
  EffectsLayer: Layer.empty,
})

const Application = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
Application.bindChild(ChildBlock, {
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  field: 'child',
  // @ts-expect-error This invalid Binding configuration has no matching overload.
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    forward: (_outMessage: typeof ChildBlock.OutMessage.Type) =>
      ParentOutMessage.ForwardedSelectedValue({ value: 'outside-root' }),
  },
})
// @ts-expect-error An Application Definition cannot complete before toComposition.
ApplicationComposition.toElement
// @ts-expect-error An Application Definition has no register alias.
Application.register
