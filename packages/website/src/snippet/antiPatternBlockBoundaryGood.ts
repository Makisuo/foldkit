// ✅ Good: the child exposes a named Step that still runs its update.

export const setTheme = Settings.step((model, theme: Theme) =>
  update(model, Message.ChangedTheme({ theme })),
)

const SettingsComposition = Settings.toComposition()

export const block = SettingsComposition.toBlock({
  init,
  update,
  expose: { setTheme },
  EffectsLayer,
})

const update = Parent.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () => settings.setTheme('Light')(model),
  }),
)
