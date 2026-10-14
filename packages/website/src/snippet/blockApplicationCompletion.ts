import { Effect, Layer } from 'effect'
import { Runtime } from 'foldkit'

import { SettingsStore } from './blockDefinition'
import {
  ApplicationComposition,
  init,
  Message,
  update,
  view,
} from './blockProfile'

export const ApplicationLayer = Layer.succeed(SettingsStore, {
  saveTheme: theme =>
    Effect.try({
      try: () => localStorage.setItem('theme', theme),
      catch: cause => new Error('Unable to save theme', { cause }),
    }),
})

const application = ApplicationComposition.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
