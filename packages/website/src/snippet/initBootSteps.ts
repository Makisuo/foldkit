import { Application } from './definition'

const init = Application.init((flags: Flags) => {
  const settingsInit = settings.init()
  const sessionInit = session.init()

  const initialModel = Model.make({
    settings: settingsInit.model,
    session: sessionInit.model,
  })

  const startup = Update.combine(initialModel, [
    settings.restore(flags.savedSettings),
    session.resume(),
  ])

  return {
    model: startup.model,
    commands: [
      ...(settingsInit.commands ?? []),
      ...(sessionInit.commands ?? []),
      ...(startup.commands ?? []),
    ],
  }
})
