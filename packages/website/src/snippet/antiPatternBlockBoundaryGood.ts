// ✅ Good: the child exposes a named Step that still runs its update.

// SETTINGS BLOCK

export const setTheme = settings.step((model, theme: Theme) =>
  update(model, Message.ChangedTheme({ theme })),
)

export const block = settings.assemble({
  init,
  update,
  steps: { setTheme },
  EffectsLayer,
})

// PARENT UPDATE

const update = definition.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () => settingsBinding.setTheme('Light')(model),
  }),
)
