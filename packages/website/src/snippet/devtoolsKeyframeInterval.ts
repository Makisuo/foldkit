import { Runtime } from 'foldkit'

import { Application, init, update, view } from './application'

const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: {
    keyframeInterval: 1,
  },
})

Runtime.run(application)
