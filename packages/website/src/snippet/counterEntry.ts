import { Runtime } from 'foldkit'

import { ApplicationDefinition, init, update, view } from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
})

Runtime.run(application)
