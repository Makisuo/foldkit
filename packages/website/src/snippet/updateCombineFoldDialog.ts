return Update.combineSteps(model, [
  foldDialogClose,
  stepModel => ({
    model: modifyFields(stepModel, { isSubmitting: () => false }),
  }),
])
