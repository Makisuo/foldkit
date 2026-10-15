import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { Message } from './message'
import { init } from './transition'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
