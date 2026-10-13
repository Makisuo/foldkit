// ✅ Good: update returns NavigateToDocuments after SaveDraft succeeds.

const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({
      model,
      commands: [SaveDraft()],
    }),

    SucceededSaveDraft: () => ({
      model,
      commands: [NavigateToDocuments()],
    }),
  }),
)
