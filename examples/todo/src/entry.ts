import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import {
  Application,
  implementation,
  Flags,
  flags,
  Message,
} from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(provide(application, ApplicationLayer), { flags })
