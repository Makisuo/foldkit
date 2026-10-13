const init = (username: string, savedTheme: Settings.Theme) => {
  const settingsInit = settings.init({ theme: savedTheme })

  return {
    model: Model.make({
      username,
      settings: settingsInit.model,
    }),
    commands: settingsInit.commands,
  }
}
