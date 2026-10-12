import { Effect, Layer, pipe } from 'effect'
import { Application, Runtime } from 'foldkit'

import * as App from './submodelBindDescriptor'
import { SettingsStore } from './submodelOwnerContract'

const application = Application.make({
  Model: App.Model,
  init: App.init,
  update: App.update,
  view: (model, h) => ({
    title: 'Profile settings',
    body: App.view(model, h),
  }),
  subscriptions: App.subscriptions,
  managedResources: App.managedResources,
  mounts: App.mounts,
  container: document.getElementById('root'),
})

const ServicesLayer = Layer.succeed(SettingsStore, {
  saveTheme: theme =>
    Effect.try({
      try: () => localStorage.setItem('theme', theme),
      catch: cause => new Error('Unable to save theme', { cause }),
    }),
})

export const AppLayer = Layer.provide(App.EffectsLayer, ServicesLayer)

pipe(application, Application.provide(AppLayer), Runtime.run)
