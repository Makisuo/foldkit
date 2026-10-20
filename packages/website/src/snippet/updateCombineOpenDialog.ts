return Update.combineSteps(model, [
  openDialog,
  stepModel => ({
    model: modifyFields(stepModel, { isSubmitting: () => false }),
  }),
])
