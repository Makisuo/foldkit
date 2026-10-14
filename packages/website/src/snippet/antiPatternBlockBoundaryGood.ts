// ✅ Good: the child exposes a named Step that still runs its update.

export const setTheme = SettingsDefinition.step((model, theme: Theme) =>
  update(model, Message.ChangedTheme({ theme })),
)

export const block = SettingsDefinition.toComposition().toBlock({
  init,
  update,
  expose: { setTheme },
  EffectsLayer,
})

const update = ParentDefinition.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () => settings.setTheme('Light')(model),
  }),
)
