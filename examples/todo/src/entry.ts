import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Flags,
  Message,
  flags,
  init,
  update,
  view,
} from './application'
import { ApplicationLayer } from './services'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
