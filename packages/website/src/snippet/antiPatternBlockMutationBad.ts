// ❌ Bad: the parent changes the Settings Model directly.

const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () => ({
      model: modifyFields(model, {
        settings: settings => modifyFields(settings, { theme: () => 'Light' }),
      }),
    }),
  }),
)
