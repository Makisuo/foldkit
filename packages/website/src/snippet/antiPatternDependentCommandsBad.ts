// ❌ Bad: both Commands start independently.

const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({
      model,
      commands: [SaveDraft(), NavigateToDocuments()],
    }),
  }),
)
