import { Runtime } from 'foldkit'

import { EffectsLayer, init } from './application'
import { ApplicationComposition } from './application'
import { Message } from './message'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
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
