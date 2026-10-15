import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update } from './application'
import { EffectsLayer } from './command'
import { Message } from './definition'
import { ApplicationLayer } from './services'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
