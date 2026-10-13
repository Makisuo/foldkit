import { Runtime } from 'foldkit'

import { Application, Message, implementation } from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
