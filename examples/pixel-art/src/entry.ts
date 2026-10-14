import { Runtime } from 'foldkit'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { EffectsLayer, Flags, flags, init } from './application'
import { ApplicationComposition } from './application'
import { Message } from './message'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const ApplicationLayer = BrowserKeyValueStore.layerLocalStorage

const application = ApplicationComposition.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
