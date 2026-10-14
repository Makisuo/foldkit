import { Runtime } from 'foldkit'

import { EffectsLayer } from './application'
import { init } from './init'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { Application, update } from './update'
import { view } from './view'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
