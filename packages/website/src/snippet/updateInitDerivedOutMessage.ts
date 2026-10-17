import { Block } from 'foldkit'

const OutMessage = defineMessageUnion({
  SelectedEndDate: { date: Schema.String },
  CompletedRange: { startDate: Schema.String, endDate: Schema.String },
})

const DateRangeDefinition = Block.define('DateRange', {
  Model,
  Message,
  OutMessage,
})

const EndDatePickerBinding = DateRangeDefinition.bindChild(DatePicker.block, {
  field: 'endDatePicker',
  parentMessage: Message.GotEndDateMessage,
  outMessage: {
    fold: foldEndDateOutMessage,
    forward: DatePicker.OutMessage.match({
      SelectedDate: ({ date }) => OutMessage.SelectedEndDate({ date }),
    }),
  },
})

const restoreEndDate = DateRangeDefinition.step(() =>
  EndDatePickerBinding.restore(),
)
