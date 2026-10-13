import { Runtime } from 'foldkit'

import { Application, implementation, Message } from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
