// ✅ Good: the child declares an operation that runs its update.

const SettingsComposition = SettingsDefinition.makeComposition()
const setTheme = SettingsComposition.makeOperation(Message.RequestedThemeChange)

export const block = SettingsComposition.makeBlock({
  init,
  update,
  operations: { setTheme },
  EffectsLayer,
})

const update = ParentComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () =>
      SettingsBinding.setTheme({ theme: 'Light' })(model),
  }),
)
