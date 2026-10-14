import { Runtime } from 'foldkit'

import { Application, Message, init, update, view } from './application'

const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
