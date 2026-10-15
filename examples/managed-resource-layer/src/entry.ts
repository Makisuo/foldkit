import { Runtime } from 'foldkit'

import { BrowserCrypto } from '@effect/platform-browser'

import {
  ApplicationComposition,
  EffectsLayer,
  Message,
  init,
  managedResources,
  update,
  view,
} from './application'

export const ApplicationLayer = BrowserCrypto.layer

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  managedResources,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
