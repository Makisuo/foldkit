import { Option } from 'effect'
import type { Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { DatePicker } from '@foldkit/ui'

import {
  Message,
  type Model,
  PersonalInfo,
  PronounsListbox,
} from './definition'

const foldPronounsOutMessage = PronounsListbox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeSelectedPronoun: () => Option.some(value),
      }),
    }),
})

export const pronounsListbox = PersonalInfo.bindChild(PronounsListbox, {
  field: 'pronouns',
  parentMessage: Message.GotPronounsMessage,
  outMessage: { fold: foldPronounsOutMessage },
})

const foldAvailableDateOutMessage = DatePicker.OutMessage.match<
  Update.Step<Model, Message>
>({
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
  ChangedViewMonth: () => model => ({ model }),
})

export const availableDatePicker = PersonalInfo.bindChild(DatePicker.block, {
  field: 'availableDate',
  parentMessage: Message.GotAvailableDateMessage,
  outMessage: { fold: foldAvailableDateOutMessage },
})

export const PersonalInfoComposition = PersonalInfo.toComposition({
  children: [pronounsListbox, availableDatePicker],
})
export type PersonalInfoViewBuilder = Block.HtmlBuilderOf<
  typeof PersonalInfoComposition
>
