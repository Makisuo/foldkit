const OutMessage = defineMessageUnion({
  SelectedEndDate: { date: Schema.String },
  CompletedRange: { startDate: Schema.String, endDate: Schema.String },
})

const endDatePicker = ApplicationDefinition.bindChild(DatePicker.block, {
  field: 'endDatePicker',
  parentMessage: Message.GotEndDateMessage,
  outMessage: {
    fold: foldEndDateOutMessage,
    forward: DatePicker.OutMessage.match({
      SelectedDate: ({ date }) => OutMessage.SelectedEndDate({ date }),
    }),
  },
})

const init = (maybeStartDate: Option.Option<string>) => {
  const datePickerInit = endDatePicker.init()
  const model = Model.make({
    endDatePicker: datePickerInit.model,
    maybeStartDate,
    maybeEndDate: Option.none(),
  })

  return endDatePicker.restore()(model)
}
