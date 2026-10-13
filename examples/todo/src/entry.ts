import { Runtime } from 'foldkit'

import {
  Application,
  Flags,
  Message,
  flags,
  implementation,
} from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
