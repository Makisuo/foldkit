import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  init,
  update,
  view,
  EffectsLayer,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application)
