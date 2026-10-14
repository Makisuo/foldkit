import { Effect, Layer } from 'effect'
import { Runtime } from 'foldkit'

import { SettingsStore } from './blockDefinition'
import { Application, init, Message, update, view } from './blockProfile'

export const makeApplication = (container: HTMLElement | null) =>
  Application.make({
    init,
    update,
    view,
    container,
    devTools: { Message },
  })

export const ApplicationLayer = Layer.succeed(SettingsStore, {
  saveTheme: theme =>
    Effect.try({
      try: () => localStorage.setItem('theme', theme),
      catch: cause => new Error('Unable to save theme', { cause }),
    }),
})

const application = makeApplication(document.getElementById('root'))

Runtime.run(application.provide(ApplicationLayer))
