import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  init,
  update,
  view,
  EffectsLayer,
  subscriptions,
} from './application'
import { ApplicationLayer } from './services'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  subscriptions,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
