import { Runtime } from 'foldkit'

import { Application, implementation } from './application'
import { Message } from './message'

const application = Application.make({
  ...implementation,
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
