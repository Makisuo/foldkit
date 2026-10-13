import { Runtime } from 'foldkit'

import { Application, Flags, implementation, Message } from './application'
import './styles.css'

const application = Application.make({
  ...implementation,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(application)
