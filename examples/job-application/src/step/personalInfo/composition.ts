import { Option } from 'effect'
import type { Block } from 'foldkit'

import { DatePickerBlock } from '@foldkit/ui'

import { PersonalInfoDefinition, PronounsListboxBlock } from './definition'

export const PronounsListboxBinding = PersonalInfoDefinition.bindChild(
  PronounsListboxBlock,
  {
    field: 'pronouns',
    init: { contextToArgs: () => [{ id: 'pronouns' }] },
  },
).withOutMessagePolicy({
  fold: PersonalInfoDefinition.makeOutMessageFold(PronounsListboxBlock, {
    Selected: ({ value }) =>
      PersonalInfoDefinition.stepFields(() => ({
        maybeSelectedPronoun: () => Option.some(value),
      })),
  }),
})

export const AvailableDatePickerBinding = PersonalInfoDefinition.bindChild(
  DatePickerBlock,
  {
    field: 'availableDate',
    init: {
      contextToArgs: today => [{ id: 'available-date', today, minDate: today }],
    },
  },
).withOutMessagePolicy({
  fold: PersonalInfoDefinition.makeOutMessageFold(DatePickerBlock, {
    SelectedDate: ({ date }) =>
      PersonalInfoDefinition.stepFields(() => ({
        maybeAvailableDate: () => Option.some(date),
      })),
    ClearedDate: () =>
      PersonalInfoDefinition.stepFields(() => ({
        maybeAvailableDate: () => Option.none(),
      })),
    ChangedViewMonth: PersonalInfoDefinition.stepNoop,
  }),
})

export const PersonalInfoComposition = PersonalInfoDefinition.makeComposition({
  bindings: [PronounsListboxBinding, AvailableDatePickerBinding],
})
export type PersonalInfoViewBuilder = Block.ViewBuilderFor<
  typeof PersonalInfoComposition
>
