import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  init,
  subscriptions,
  update,
  view,
} from './application'
import { ApplicationLayer } from './layer'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  subscriptions,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
