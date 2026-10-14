// ✅ Good: initialize through the Binding, then invoke the public restoration
// Step after the complete parent Model exists.

const init = (username: string, savedTheme: Settings.Theme) => {
  const settingsInit = settings.init()
  const model = Model.make({
    username,
    settings: settingsInit.model,
    maybeRestoredTheme: Option.none(),
  })

  return settings.restore(savedTheme)(model)
}
