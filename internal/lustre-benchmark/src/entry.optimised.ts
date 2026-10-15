import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update } from './application'
import { view } from './view.optimised'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view: ApplicationComposition.view(view),
  container: document.getElementById('root'),
  devTools: false,
})

Runtime.run(application)
