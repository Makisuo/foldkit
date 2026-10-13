import { Runtime } from 'foldkit'

import {
  Application,
  init,
  update,
  view,
  EffectsLayer,
  subscriptions,
} from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  subscriptions,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
