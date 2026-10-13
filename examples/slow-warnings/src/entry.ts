import { Runtime } from 'foldkit'

import { Application, implementation, handleSlow, Message } from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  slow: {
    show: 'Always',
    onSlow: handleSlow,
  },
  devTools: { Message },
})

Runtime.run(application)
