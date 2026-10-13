import { Runtime } from 'foldkit'

import { Application, init, update } from './application'
import { view } from './view.optimised'

const application = Application.make({
  init,
  update,
  view: Application.view(view),
  container: document.getElementById('root'),
  devTools: false,
})

Runtime.run(application)
