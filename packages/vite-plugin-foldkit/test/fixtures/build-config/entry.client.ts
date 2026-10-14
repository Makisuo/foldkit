import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  Flags,
  Message,
  init,
  update,
  view,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(application)
