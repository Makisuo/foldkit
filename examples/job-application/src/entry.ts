import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  Flags,
  flags,
  init,
} from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { update } from './update'
import { view } from './view/view'

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
