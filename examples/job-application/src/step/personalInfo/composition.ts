import { Option } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { DatePickerBlock } from '@foldkit/ui'

import { PersonalInfoDefinition, PronounsListboxBlock } from './definition'

const foldPronounsOutMessage = PersonalInfoDefinition.makeOutMessageFold(
  PronounsListboxBlock,
  {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, {
          maybeSelectedPronoun: () => Option.some(value),
        }),
      }),
  },
)

export const PronounsListboxBinding = PersonalInfoDefinition.bindChild(
  PronounsListboxBlock,
  {
    field: 'pronouns',
    init: { contextToArgs: () => [{ id: 'pronouns' }] },
    outMessage: { fold: foldPronounsOutMessage },
  },
)

const foldAvailableDateOutMessage = PersonalInfoDefinition.makeOutMessageFold(
  DatePickerBlock,
  {
    SelectedDate:
      ({ date }) =>
      model => ({
        model: modifyFields(model, {
          maybeAvailableDate: () => Option.some(date),
        }),
      }),
    ClearedDate: () => model => ({
      model: modifyFields(model, { maybeAvailableDate: () => Option.none() }),
    }),
    ChangedViewMonth: () => PersonalInfoDefinition.stepNoop(),
  },
)

export const AvailableDatePickerBinding = PersonalInfoDefinition.bindChild(
  DatePickerBlock,
  {
    field: 'availableDate',
    init: {
      contextToArgs: today => [{ id: 'available-date', today, minDate: today }],
    },
    outMessage: { fold: foldAvailableDateOutMessage },
  },
)

export const PersonalInfoComposition = PersonalInfoDefinition.makeComposition({
  bindings: [PronounsListboxBinding, AvailableDatePickerBinding],
})
export type PersonalInfoViewBuilder = Block.ViewBuilderFor<
  typeof PersonalInfoComposition
>
