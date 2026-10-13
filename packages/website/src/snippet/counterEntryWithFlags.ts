import { Runtime } from 'foldkit'

import { Application, init, update, view } from './application'
import { Flags, flags } from './flags'
import { ApplicationLayer } from './services'

const application = Application.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer), { flags })
