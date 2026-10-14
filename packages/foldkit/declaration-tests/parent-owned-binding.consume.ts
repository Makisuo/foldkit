import { Layer } from 'effect'

import type { Block, Command, Update } from '../src/index.js'
import {
  ChildBlock,
  ChildClock,
  ParentOutMessage,
  ReadChildValue,
  directChild,
  directChildInspection,
  forwardingChild,
  keyedChild,
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
export type KeyedChildMessage = Expect<
  Equal<Parameters<typeof keyedChild.fold>[2], ChildMessage>
>
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
