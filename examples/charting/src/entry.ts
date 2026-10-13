import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import { Application, implementation } from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(provide(application, ApplicationLayer))
