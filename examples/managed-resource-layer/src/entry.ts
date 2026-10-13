import { Runtime } from 'foldkit'

import { Application, Message, implementation } from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
