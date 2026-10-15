import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { flags } from './flags'
import { Message } from './message'
import { Flags } from './model'
import { ApplicationLayer } from './services'
import { init, update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), {
  flags,
})
