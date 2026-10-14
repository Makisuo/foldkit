// ❌ Bad: both Commands start independently.

const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({
      model,
      commands: [SaveDraft(), NavigateToDocuments()],
    }),
  }),
)
