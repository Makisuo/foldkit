import { Layer } from 'effect'
import { Runtime } from 'foldkit'

import { BrowserCrypto, BrowserKeyValueStore } from '@effect/platform-browser'

import { EffectsLayer, Flags, flags, init } from './application'
import { ApplicationComposition } from './application'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

export const ApplicationLayer = Layer.mergeAll(
  BrowserCrypto.layer,
  BrowserKeyValueStore.layerLocalStorage,
)

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
