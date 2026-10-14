import { Runtime } from 'foldkit'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { ApplicationComposition, init, update, view } from './counterFlagsRoot'
import { Flags, flags } from './flagsDefinition'

const ApplicationLayer = BrowserKeyValueStore.layerLocalStorage

const application = ApplicationComposition.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer), { flags })
