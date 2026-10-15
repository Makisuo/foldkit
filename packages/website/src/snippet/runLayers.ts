import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  init,
  update,
  view,
} from './application'
import { ApplicationLayer } from './layer'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer))
