import { Effect, Layer } from 'effect'
import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import { implementation, Message, registered } from './blockBindDescriptor'
import { SettingsStore } from './blockOwnerContract'

export const makeApplication = (container: HTMLElement | null) =>
  registered.make({
    ...implementation,
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

Runtime.run(provide(application, ApplicationLayer))
