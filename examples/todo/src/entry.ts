import { Runtime } from 'foldkit'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { ApplicationComposition, EffectsLayer } from './application'
import { flags } from './flags'
import { Message } from './message'
import { Flags } from './model'
import { init, update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(BrowserKeyValueStore.layerLocalStorage), {
  flags,
})
