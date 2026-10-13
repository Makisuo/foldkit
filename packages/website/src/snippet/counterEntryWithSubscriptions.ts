import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

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

Runtime.run(provide(application, ApplicationLayer))
