// ❌ Bad: both Commands start independently.

const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({
      model,
      commands: [SaveDraft(), NavigateToDocuments()],
    }),
  }),
)
