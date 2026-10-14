import { Runtime } from 'foldkit'

import { EffectsLayer, Flags, flags, init } from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { Application, update } from './update'
import { view } from './view'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
