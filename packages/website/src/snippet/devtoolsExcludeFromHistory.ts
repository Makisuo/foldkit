import { Runtime } from 'foldkit'

import { Application, init, update, view } from './application'

const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: {
    excludeFromHistory: ['TickedFrame', 'MovedPointer'],
  },
})

Runtime.run(application)
