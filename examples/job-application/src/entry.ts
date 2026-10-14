import { Runtime } from 'foldkit'

import { EffectsLayer, Flags, flags, init } from './application'
import { Application } from './connection'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { update } from './update'
import { view } from './view/view'

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
