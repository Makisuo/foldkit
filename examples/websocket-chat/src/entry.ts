import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  init,
  managedResources,
  subscriptions,
  update,
  view,
} from './application'
import { ApplicationLayer } from './services'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  subscriptions,
  managedResources,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
