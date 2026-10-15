import { Layer, Option } from 'effect'

import type { Block, Command, Update } from '../src/index.js'
import {
  ChildBlock,
  ChildClock,
  Parent,
  ParentMessage,
  ParentOutMessage,
  PlainChildBlock,
  ReadChildValue,
  directChild,
  directChildInspection,
  forwardingChild,
  genericKeyedBinding,
  genericKeyedInspection,
  inlineKeyedChildWithoutOutMessage,
  keyedChild,
  keyedChildWithoutOutMessage,
  optionalChild,
  taggedChild,
} from './parent-owned-binding.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

type ParentModel = Parameters<typeof directChild.fold>[0]
type ChildMessage = typeof ChildBlock.Message.Type
type NamedEntry = Readonly<{
  id: string
  child: typeof PlainChildBlock.Model.Type
}>
type ChildEntry = Readonly<{
  id: number
  child: typeof ChildBlock.Model.Type
}>

type EmittedChildPolicy = Block.OutMessagePolicy<
  typeof Parent.Model.Type,
  typeof ChildBlock.Message.Type,
  typeof Parent.Message.Type,
  typeof ChildBlock.OutMessage.Type
>
type EmittedChildConfig = Block.BindingConfig<
  typeof ChildBlock,
  typeof Parent.Model.Type,
  typeof Parent.Message.Type,
  'emittedChild',
  EmittedChildPolicy
>
type EmittedPlainChildConfig = Block.BindingConfig<
  typeof PlainChildBlock,
  typeof Parent.Model.Type,
  typeof Parent.Message.Type,
  'emittedPlainChild'
>
const emittedChildPolicy: EmittedChildPolicy = {
  fold: () => model => ({ model }),
}
const acceptedEmittedChildConfig: EmittedChildConfig = {
  placement: 'emittedChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  outMessage: emittedChildPolicy,
}
const acceptedEmittedPlainChildConfig: EmittedPlainChildConfig = {
  placement: 'emittedPlainChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
}
// @ts-expect-error Emitted OutMessage children require an OutMessage policy.
const missingEmittedChildPolicy: EmittedChildConfig = {
  placement: 'emittedChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
}
const forbiddenEmittedPlainChildPolicy: EmittedPlainChildConfig = {
  placement: 'emittedPlainChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  // @ts-expect-error Emitted children without OutMessages forbid a policy.
  outMessage: emittedChildPolicy,
}
// @ts-expect-error An absent emitted OutMessage policy must be omitted.
const undefinedEmittedPlainChildPolicy: EmittedPlainChildConfig = {
  placement: 'emittedPlainChild',
  read: model => Option.some(model.child),
  write: model => model,
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  outMessage: undefined,
}

void acceptedEmittedChildConfig
void acceptedEmittedPlainChildConfig
void missingEmittedChildPolicy
void forbiddenEmittedPlainChildPolicy
void undefinedEmittedPlainChildPolicy

export type DirectParentModel = Expect<
  Equal<Parameters<typeof directChild.fold>[0], ParentModel>
>
export type DirectChildMessage = Expect<
  Equal<Parameters<typeof directChild.fold>[1], ChildMessage>
>
export type OptionalParentModel = Expect<
  Equal<Parameters<typeof optionalChild.fold>[0], ParentModel>
>
export type TaggedParentModel = Expect<
  Equal<Parameters<typeof taggedChild.fold>[0], ParentModel>
>
export type KeyedKey = Expect<
  Equal<Parameters<typeof keyedChild.fold>[1], number>
>
export type KeyedPlacement = Expect<
  Equal<typeof keyedChild.placement, 'entries'>
>
export type KeyedChildMessage = Expect<
  Equal<Parameters<typeof keyedChild.fold>[2], ChildMessage>
>
export type KeyedWithoutOutMessageKey = Expect<
  Equal<Parameters<typeof keyedChildWithoutOutMessage.fold>[1], string>
>
export type KeyedWithoutOutMessageChildMessage = Expect<
  Equal<Parameters<typeof keyedChildWithoutOutMessage.fold>[2], ChildMessage>
>
export type InlineKeyedWithoutOutMessageKey = Expect<
  Equal<Parameters<typeof inlineKeyedChildWithoutOutMessage.fold>[1], string>
>

const wrongEmittedSubscriptionKey = (
  _model: typeof Parent.Model.Type,
  _id: number,
) => true
type EmittedNamedKeyedConfig = Block.KeyedBindingConfig<
  typeof PlainChildBlock,
  typeof Parent.Model.Type,
  typeof Parent.Message.Type,
  NamedEntry,
  string,
  'emittedNamedEntries'
>
const acceptedEmittedNamedKeyedConfig: EmittedNamedKeyedConfig = {
  placement: 'emittedNamedEntries',
  readAll: model => model.namedEntries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotNamedEntryMessage({ id, message }),
}
const emittedNamedKeyedConfig: EmittedNamedKeyedConfig = {
  placement: 'emittedNamedEntries',
  readAll: model => model.namedEntries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotNamedEntryMessage({ id, message }),
  // @ts-expect-error Emitted keyed Subscription gates preserve the exact string key.
  subscriptions: { when: wrongEmittedSubscriptionKey },
}

type EmittedKeyedChildPolicy = Block.KeyedOutMessagePolicy<
  typeof Parent.Model.Type,
  typeof ChildBlock.Message.Type,
  typeof Parent.Message.Type,
  typeof ChildBlock.OutMessage.Type,
  number
>
type EmittedKeyedChildConfig = Block.KeyedBindingConfig<
  typeof ChildBlock,
  typeof Parent.Model.Type,
  typeof Parent.Message.Type,
  ChildEntry,
  number,
  'emittedEntries',
  EmittedKeyedChildPolicy
>
const emittedKeyedChildPolicy: EmittedKeyedChildPolicy = {
  fold: () => model => ({ model }),
}
const acceptedEmittedKeyedChildConfig: EmittedKeyedChildConfig = {
  placement: 'emittedEntries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  outMessage: emittedKeyedChildPolicy,
}
// @ts-expect-error Emitted keyed OutMessage children require a policy.
const missingEmittedKeyedChildPolicy: EmittedKeyedChildConfig = {
  placement: 'emittedEntries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
}
const forbiddenEmittedPlainKeyedPolicy: EmittedNamedKeyedConfig = {
  placement: 'emittedNamedEntries',
  readAll: model => model.namedEntries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotNamedEntryMessage({ id, message }),
  // @ts-expect-error Emitted keyed children without OutMessages forbid a policy.
  outMessage: emittedKeyedChildPolicy,
}
// @ts-expect-error An absent emitted keyed OutMessage policy must be omitted.
const undefinedEmittedPlainKeyedPolicy: EmittedNamedKeyedConfig = {
  placement: 'emittedNamedEntries',
  readAll: model => model.namedEntries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (id, message) =>
    ParentMessage.GotNamedEntryMessage({ id, message }),
  outMessage: undefined,
}

void acceptedEmittedKeyedChildConfig
void acceptedEmittedNamedKeyedConfig
void missingEmittedKeyedChildPolicy
void forbiddenEmittedPlainKeyedPolicy
void undefinedEmittedPlainKeyedPolicy

Parent.bindChild(PlainChildBlock, emittedNamedKeyedConfig)
Parent.bindChild(PlainChildBlock, acceptedEmittedNamedKeyedConfig)
export type DirectRegistration = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof directChild.fold>>,
    Block.BindingRequirement<'child', typeof ChildBlock>
  >
>
export type DirectRefreshRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof directChild.refresh>>,
    Block.Scoped<'child', Command.HandlerOf<typeof ReadChildValue>>
  >
>
export type DirectRefreshRegistration = Expect<
  Equal<
    Update.RegistrationEvidenceOf<
      ReturnType<ReturnType<typeof directChild.refresh>>
    >,
    Block.BindingRequirement<'child', typeof ChildBlock>
  >
>
export type DirectInspectionServices = Expect<
  Equal<Layer.Services<typeof directChildInspection.EffectsLayer>, ChildClock>
>
export type DirectInspectionError = Expect<
  Equal<
    Layer.Error<typeof directChildInspection.EffectsLayer>,
    'HandlerUnavailable'
  >
>
export type ForwardedOutMessage = Expect<
  Equal<
    ReturnType<ReturnType<typeof forwardingChild.select>>['outMessage'],
    typeof ParentOutMessage.Type | undefined
  >
>

export type GenericKeyedKey = Expect<
  Equal<
    Parameters<typeof genericKeyedBinding.child.fold>[1],
    'first' | 'second'
  >
>
export type GenericKeyedOperationKey = Expect<
  Equal<
    Parameters<typeof genericKeyedBinding.child.refresh>[0],
    'first' | 'second'
  >
>
export type GenericKeyedPayload = Expect<
  Equal<
    (typeof genericKeyedBinding.Model.Type)['entries'][number]['payload'],
    'One' | 'Two'
  >
>
export type GenericKeyedPolicyRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof genericKeyedBinding.child.select>>,
    Block.Scoped<
      'DeclarationParentOwnedChild',
      Command.HandlerOf<typeof ReadChildValue>
    >
  >
>
export type GenericKeyedInspectionServices = Expect<
  Equal<Layer.Services<typeof genericKeyedInspection.EffectsLayer>, ChildClock>
>
export type GenericKeyedInspectionError = Expect<
  Equal<
    Layer.Error<typeof genericKeyedInspection.EffectsLayer>,
    'HandlerUnavailable'
  >
>
// @ts-expect-error A broad OutMessage policy input must not widen the inferred key.
genericKeyedBinding.child.refresh('third')
// @ts-expect-error Keyed exposed operations require the exact key argument.
genericKeyedBinding.child.refresh(1)

const concreteEmittedKeyedConfig = {
  ...acceptedEmittedKeyedChildConfig,
  outMessage: { fold: () => (model: ParentModel) => ({ model }) },
}
Parent.bindChild(ChildBlock, concreteEmittedKeyedConfig)
const emittedKeyedConfigWithExtraField = {
  ...concreteEmittedKeyedConfig,
  unexpected: true,
}
// @ts-expect-error Capturing emitted keyed policies must retain excess-field rejection.
Parent.bindChild(ChildBlock, emittedKeyedConfigWithExtraField)
