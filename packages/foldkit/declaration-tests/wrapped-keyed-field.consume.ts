import { Layer, Schema } from 'effect'

import type { Block, Command, Update } from '../src/index.js'
import {
  Choice,
  ChoiceBuildFailure,
  ChoiceId,
  ChoiceService,
  ParentModel,
  TextMessage,
  choices,
  choiceInspection,
  composition,
  firstChoiceId,
  initialParentModel,
  literalChoices,
  makePayloadParent,
  payloadParent,
  plainChoices,
  textEntries,
} from './wrapped-keyed-field.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export type Key = Expect<
  Equal<Parameters<typeof choices.fold>[1], typeof ChoiceId.Type>
>
export type LiteralKey = Expect<
  Equal<Parameters<typeof literalChoices.fold>[1], 'Primary' | 'Secondary'>
>
export type Placement = Expect<Equal<typeof choices.placement, 'choices'>>
export type PlainPlacement = Expect<
  Equal<typeof plainChoices.placement, 'plainChoices'>
>
export type LiteralPlacement = Expect<
  Equal<typeof literalChoices.placement, 'literalChoices'>
>
export type ParentModelInput = Expect<
  Equal<Parameters<typeof choices.fold>[0], typeof ParentModel.Type>
>
export type ChildMessage = Expect<
  Equal<Parameters<typeof choices.fold>[2], typeof Choice.Message.Type>
>
export type RefinedMessagePayload = Expect<
  Equal<
    Extract<
      Parameters<typeof choices.fold>[2],
      Readonly<{ _tag: 'UpdatedValue' }>
    >['value'],
    'One' | 'Two'
  >
>
export type RefinedOutMessagePayload = Expect<
  Equal<
    Extract<
      typeof Choice.OutMessage.Type,
      Readonly<{ _tag: 'SelectedValue' }>
    >['value'],
    'One' | 'Two'
  >
>
export type FoldModel = Expect<
  Equal<ReturnType<typeof choices.fold>['model'], typeof ParentModel.Type>
>
export type GenericPayload = Expect<
  Equal<
    (typeof payloadParent.Model.Type)['entries'][number]['payload'],
    Readonly<{ label: string }>
  >
>
export type GenericPayloadKey = Expect<
  Equal<Parameters<typeof payloadParent.binding.fold>[1], typeof ChoiceId.Type>
>
export type SetValueArgs = Expect<
  Equal<
    Parameters<typeof choices.setValue>,
    [key: typeof ChoiceId.Type, value: 'One' | 'Two']
  >
>
export type RefreshArgs = Expect<
  Equal<Parameters<typeof choices.refresh>, [key: typeof ChoiceId.Type]>
>
export type InitArgs = Expect<
  Equal<
    Parameters<typeof choices.init>,
    [key: typeof ChoiceId.Type, value: 'One' | 'Two']
  >
>
export type Registration = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof choices.fold>>,
    Block.BindingRequirement<'choices', typeof Choice.block>
  >
>
export type RefreshRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof choices.refresh>>,
    Block.Scoped<'choices', Command.HandlerOf<typeof Choice.ReadChoice>>
  >
>
export type PolicyRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof choices.select>>,
    Block.Scoped<'choices', Command.HandlerOf<typeof Choice.ReadChoice>>
  >
>
export type InspectionServices = Expect<
  Equal<Layer.Services<typeof choiceInspection.EffectsLayer>, ChoiceService>
>
export type InspectionError = Expect<
  Equal<Layer.Error<typeof choiceInspection.EffectsLayer>, ChoiceBuildFailure>
>
export type Builder = Block.HtmlBuilderOf<typeof composition>

const literalPayloadParent = makePayloadParent(
  Schema.Literals(['Primary', 'Secondary']),
)
export type EmittedGenericPayload = Expect<
  Equal<
    (typeof literalPayloadParent.Model.Type)['entries'][number]['payload'],
    'Primary' | 'Secondary'
  >
>
export type EmittedGenericParentModel = Expect<
  Equal<
    Parameters<typeof literalPayloadParent.binding.fold>[0],
    typeof literalPayloadParent.Model.Type
  >
>

choices.fold(
  initialParentModel,
  firstChoiceId,
  Choice.Message.UpdatedValue({ value: 'Two' }),
)
choices.setValue(firstChoiceId, 'One')(initialParentModel)
choices.refresh(firstChoiceId)(initialParentModel)
choices.select(firstChoiceId)(initialParentModel)
literalChoices.setValue('Secondary', 'Two')(initialParentModel)
textEntries.fold(
  initialParentModel,
  'text',
  TextMessage.ReplacedText({ value: 'next' }),
)

// @ts-expect-error Emitted wrapped Bindings preserve branded keys.
choices.refresh('first')
// @ts-expect-error Emitted wrapped Bindings preserve refined exposed arguments.
choices.setValue(firstChoiceId, 'Three')
// @ts-expect-error Emitted wrapped Bindings preserve literal keys.
literalChoices.select('Tertiary')
