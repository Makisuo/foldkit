import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

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

Runtime.run(provide(application, ApplicationLayer), { flags })
