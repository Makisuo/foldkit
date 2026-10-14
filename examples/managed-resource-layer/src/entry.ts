import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  init,
  managedResources,
  update,
  view,
} from './application'
import { ApplicationLayer } from './services'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  managedResources,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
