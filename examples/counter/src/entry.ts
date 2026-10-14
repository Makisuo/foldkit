import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  Message,
  init,
  update,
  view,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
