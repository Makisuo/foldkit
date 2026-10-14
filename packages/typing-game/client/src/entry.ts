import { Layer } from 'effect'
import { Runtime } from 'foldkit'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import {
  ApplicationComposition,
  EffectsLayer,
  init,
  update,
} from './application'
import { Message } from './message'
import { RoomsClientLayer } from './rpc'
import { view } from './view'

const ApplicationLayer = Layer.mergeAll(
  RoomsClientLayer,
  BrowserKeyValueStore.layerSessionStorage,
)

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message, mode: 'TimeTravel' },
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

Runtime.run(application.provide(ApplicationLayer))
