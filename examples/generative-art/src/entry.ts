import { Runtime } from 'foldkit'

import { EffectsLayer, init } from './application'
import { Message } from './message'
import { subscriptions } from './subscription'
import { Application, update } from './update'
import { view } from './view'

const application = Application.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: {
    Message,
    excludeFromHistory: [
      'TickedFrame',
      'MovedPointer',
      'CompletedGenerateAmbientParticle',
    ],
  },
})

Runtime.run(application)
