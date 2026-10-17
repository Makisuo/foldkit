import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { DatePicker } from '@foldkit/ui'

import { Message, WorkHistoryEntryDefinition } from './definition'

const foldStartDateOutMessage = DatePicker.OutMessage.match({
  ChangedViewMonth: () => WorkHistoryEntryDefinition.step(model => ({ model })),
  SelectedDate: ({ date }) =>
    Update.combine([
      WorkHistoryEntryDefinition.step(model => ({
        model: modifyFields(model, { maybeStartDate: () => Option.some(date) }),
      })),
      EndDatePickerBinding.informMinDateChanged(Option.some(date)),
    ]),
  ClearedDate: () =>
    Update.combine([
      WorkHistoryEntryDefinition.step(model => ({
        model: modifyFields(model, { maybeStartDate: () => Option.none() }),
      })),
      EndDatePickerBinding.informMinDateChanged(Option.none()),
    ]),
})

export const StartDatePickerBinding = WorkHistoryEntryDefinition.bindChild(
  DatePicker.block,
  {
    field: 'startDate',
    parentMessage: Message.GotStartDateMessage,
    init: {
      args: ({ entryId, today }) => [{ id: `${entryId}-start`, today }],
    },
    outMessage: { fold: foldStartDateOutMessage },
  },
)

const foldEndDateOutMessage = DatePicker.OutMessage.match({
  ChangedViewMonth: () => WorkHistoryEntryDefinition.step(model => ({ model })),
  SelectedDate: ({ date }) =>
    Update.combine([
      WorkHistoryEntryDefinition.step(model => ({
        model: modifyFields(model, { maybeEndDate: () => Option.some(date) }),
      })),
      StartDatePickerBinding.informMaxDateChanged(Option.some(date)),
    ]),
  ClearedDate: () =>
    Update.combine([
      WorkHistoryEntryDefinition.step(model => ({
        model: modifyFields(model, { maybeEndDate: () => Option.none() }),
      })),
      StartDatePickerBinding.informMaxDateChanged(Option.none()),
    ]),
})

export const EndDatePickerBinding = WorkHistoryEntryDefinition.bindChild(
  DatePicker.block,
  {
    field: 'endDate',
    parentMessage: Message.GotEndDateMessage,
    init: {
      args: ({ entryId, today }) => [{ id: `${entryId}-end`, today }],
    },
    outMessage: { fold: foldEndDateOutMessage },
  },
)

export const WorkHistoryEntryComposition =
  WorkHistoryEntryDefinition.makeComposition({
    childBindings: [StartDatePickerBinding, EndDatePickerBinding],
  })
