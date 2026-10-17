import { Option, Schema } from 'effect'
import { Block as BlockValue, Message } from 'foldkit'
import type * as Block from 'foldkit/block'
import type * as Command from 'foldkit/command'
import type * as Update from 'foldkit/update'

import {
  ChildBlock as DirectChildBlock,
  DeclarationParentOwnedParentDefinition as DirectParent,
  ParentMessage as DirectParentMessage,
  KeyedChildBinding,
  KeyedChildWithoutOutMessageBinding,
  OptionalChildBinding,
  TaggedChildBinding,
} from './parent-owned-binding.accepted.js'
import {
  Choice,
  ChoiceId,
  DeclarationWrappedKeyedFieldParentDefinition,
  LiteralChoicesBinding,
  ParentMessage,
  PlainChoicesBinding,
  TextEntriesBinding,
} from './wrapped-keyed-field.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? (<Value>() => Value extends Right ? 1 : 2) extends <
        Value,
      >() => Value extends Left ? 1 : 2
      ? true
      : false
    : false
type Expect<Value extends true> = Value
type ParentModel =
  typeof DeclarationWrappedKeyedFieldParentDefinition.Model.Type
type ModelOnlyReturn = Readonly<{ model: ParentModel }>

const wrongModelPolicy = {
  fold:
    (_key: typeof ChoiceId.Type, _outMessage: typeof Choice.OutMessage.Type) =>
    (_model: ParentModel) => ({
      model: Choice.block.Model.make({ value: 'One' }),
    }),
}
export const WrongModelBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: wrongModelPolicy,
  })

export const foreignMessagePolicy = {
  fold:
    (_key: typeof ChoiceId.Type, _outMessage: typeof Choice.OutMessage.Type) =>
    (model: ParentModel) => ({
      model,
      commands: [Choice.ReadChoice()],
    }),
}
export const ForeignMessageBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: foreignMessagePolicy,
  })

const undeclaredOutMessagePolicy = {
  fold:
    (_key: typeof ChoiceId.Type, _outMessage: typeof Choice.OutMessage.Type) =>
    (model: ParentModel) => ({
      model,
      outMessage: Choice.OutMessage.SelectedValue({ value: 'One' }),
    }),
}
export const UndeclaredOutMessageBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: undeclaredOutMessagePolicy,
  })

const ForeignMessage = Message.defineMessageUnion({ CompletedForeign: {} })
declare const foreignCommand: Command.Command<
  typeof ForeignMessage.Type,
  never,
  never
>
type UnionForeignReturn =
  | ModelOnlyReturn
  | Readonly<{
      model: ParentModel
      commands: Update.Commands<typeof ForeignMessage.Type>
    }>
export const unionForeignMessagePolicy: Readonly<{
  fold: (
    key: typeof ChoiceId.Type,
    outMessage: typeof Choice.OutMessage.Type,
  ) => (model: ParentModel) => UnionForeignReturn
}> = {
  fold: (_key, _outMessage) => model => ({
    model,
    commands: [foreignCommand],
  }),
}
export const UnionForeignBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: unionForeignMessagePolicy,
  })

export const optionalForeignMessagePolicy: Readonly<{
  fold: (
    key: typeof ChoiceId.Type,
    outMessage: typeof Choice.OutMessage.Type,
  ) => Update.Step<
    ParentModel,
    typeof Choice.Message.Type,
    Command.HandlerOf<typeof Choice.ReadChoice>
  >
}> = {
  fold: (_key, _outMessage) => model => ({
    model,
    commands: [Choice.ReadChoice()],
  }),
}
export const OptionalForeignBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: optionalForeignMessagePolicy,
  })

type RegisteredReturn = ModelOnlyReturn &
  Update.RegistrationEvidence<'SiblingBinding'>
export const registeredPolicy: Readonly<{
  fold: (
    key: typeof ChoiceId.Type,
    outMessage: typeof Choice.OutMessage.Type,
  ) => (model: ParentModel) => ModelOnlyReturn | RegisteredReturn
}> = {
  fold: (_key, _outMessage) => model => ({ model }),
}
export const RegisteredPolicyBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: registeredPolicy,
  })

const ForwardOutMessage = Message.defineMessageUnion({
  ForwardedChoice: { value: Schema.String },
})
const ForwardParentMessage = Message.defineMessageUnion({
  GotChoiceMessage: { id: ChoiceId, message: Choice.Message },
})
export const DeclarationPolicyForwardDefinition = BlockValue.define(
  'DeclarationPolicyForward',
  {
    Model: DeclarationWrappedKeyedFieldParentDefinition.Model,
    Message: ForwardParentMessage,
    OutMessage: ForwardOutMessage,
  },
)
const wrongForwardPolicy = {
  forward: (
    _key: typeof ChoiceId.Type,
    outMessage: typeof Choice.OutMessage.Type,
  ) => outMessage,
}
export const WrongForwardBinding = DeclarationPolicyForwardDefinition.bindChild(
  Choice.block,
  {
    readAll: model => model.choices,
    key: item => item.id,
    read: item => item.choice,
    writeAt: model => model,
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChoiceMessage,
      args: (_model, { id, message }) => Option.some([id, message]),
    },
    outMessage: wrongForwardPolicy,
  },
)

export const PolicyCompanionBindings = [
  LiteralChoicesBinding,
  TextEntriesBinding,
] as const
export const DirectPolicyCompanionBindings = [
  OptionalChildBinding,
  TaggedChildBinding,
  KeyedChildBinding,
  KeyedChildWithoutOutMessageBinding,
] as const

export const PureComposition =
  DeclarationWrappedKeyedFieldParentDefinition.makeComposition({
    childBindings: [PlainChoicesBinding, ...PolicyCompanionBindings],
  })

type UnionRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof unionForeignMessagePolicy.fold>>,
    never
  >
>
type OptionalRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof optionalForeignMessagePolicy.fold>>,
    Command.HandlerOf<typeof Choice.ReadChoice>
  >
>
type RegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<
      ReturnType<ReturnType<typeof registeredPolicy.fold>>
    >,
    'SiblingBinding'
  >
>

export type BindingPolicyAssertions = [
  UnionRequirementsAreExact,
  OptionalRequirementsAreExact,
  RegistrationIsExact,
]

export {
  Choice,
  DeclarationWrappedKeyedFieldParentDefinition as Parent,
  ParentMessage,
}

export const DirectDomainBinding = DirectParent.bindChild(DirectChildBlock, {
  field: 'child',
  parentMessage: DirectParentMessage.GotChildMessage,
  outMessage: {
    fold: (_outMessage: typeof DirectChildBlock.OutMessage.Type) =>
      DirectParent.step(model => ({ model })),
  },
})
export const DirectDomainComposition = DirectParent.makeComposition({
  childBindings: [DirectDomainBinding, ...DirectPolicyCompanionBindings],
})

export const KeyedDomainBinding =
  DeclarationWrappedKeyedFieldParentDefinition.bindChild(Choice.block, {
    field: 'literalChoices',
    key: 'kind',
    childField: 'choice',
    toParentMessage: (kind, message) =>
      ParentMessage.GotLiteralChoiceMessage({ kind, message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotLiteralChoiceMessage,
      args: (_model, { kind, message }) => Option.some([kind, message]),
    },
    outMessage: {
      fold: (
        _key: typeof ParentMessage.GotLiteralChoiceMessage.Type.kind,
        _outMessage: typeof Choice.OutMessage.Type,
      ) =>
        DeclarationWrappedKeyedFieldParentDefinition.step(model => ({ model })),
    },
  })
export const KeyedDomainComposition =
  DeclarationWrappedKeyedFieldParentDefinition.makeComposition({
    childBindings: [
      KeyedDomainBinding,
      PlainChoicesBinding,
      TextEntriesBinding,
    ],
  })

const retainedUnionEvidence: Block.BindingPolicyEvidence<
  typeof unionForeignMessagePolicy
> = UnionForeignBinding
void retainedUnionEvidence

export {
  DirectChildBlock,
  DirectParent,
  DirectParentMessage,
  PlainChoicesBinding,
  TextEntriesBinding,
}
