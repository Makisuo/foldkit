import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
})

Runtime.run(application)
