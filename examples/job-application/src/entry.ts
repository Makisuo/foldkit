import { Runtime } from 'foldkit'

import { BrowserCrypto } from '@effect/platform-browser'

import {
  ApplicationComposition,
  EffectsLayer,
  Flags,
  flags,
  init,
} from './application'
import { Message } from './message'
import { update } from './update'
import { view } from './view/view'

export const ApplicationLayer = BrowserCrypto.layer

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
