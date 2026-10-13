import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import { Application, Message, implementation } from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(provide(application, ApplicationLayer))
