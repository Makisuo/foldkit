import { Runtime } from 'foldkit'

import { Application, implementation } from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
