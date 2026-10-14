import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  init,
  subscriptions,
  update,
  view,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
