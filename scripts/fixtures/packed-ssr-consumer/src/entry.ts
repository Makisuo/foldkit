import { Runtime } from 'foldkit'

import { Application, Flags, Message, implementation } from './application'

const application = Application.make({
  ...implementation,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(application)
