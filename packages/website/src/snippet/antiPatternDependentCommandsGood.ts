// ✅ Good: update returns NavigateToDocuments after SaveDraft succeeds.

const update = ApplicationComposition.update((model, message) =>
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
