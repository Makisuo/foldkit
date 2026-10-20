const forwardDatePickerOutMessage = DateRangeDefinition.makeOutMessageForward(
  DatePickerBlock,
  {
    SelectedDate: ({ date }) => OutMessage.SelectedEndDate({ date }),
    Closed: () => undefined,
  },
)

export const DatePickerBinding = DateRangeDefinition.bindChild(
  DatePickerBlock,
  { field: 'datePicker' },
).withOutMessagePolicy({ forward: forwardDatePickerOutMessage })
