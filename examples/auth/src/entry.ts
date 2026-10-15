import { Runtime } from 'foldkit'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import {
  ApplicationComposition,
  EffectsLayer,
  Flags,
  flags,
  init,
} from './application'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

export const ApplicationLayer = BrowserKeyValueStore.layerLocalStorage

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
