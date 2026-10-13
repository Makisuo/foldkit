import { Runtime } from 'foldkit'

import { Application, implementation } from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
})

Runtime.run(application)
