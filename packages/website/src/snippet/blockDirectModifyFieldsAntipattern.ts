// ❌ Don't reach into the child's Model from the parent's update.
// This bypasses SettingsDefinition.update, so its invariants, Commands,
// and OutMessages are skipped.
ClickedResetSettings: () => ({
  model: modifyFields(model, {
    settings: settings => modifyFields(settings, { theme: () => 'Light' }),
  }),
})
