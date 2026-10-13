import { Option } from 'effect'
import { Runtime } from 'foldkit'

import { Application, implementation, crashView, Message } from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  crash: {
    view: crashView,
    report: ({ error, model, message }) => {
      console.log('Crash report:', {
        error,
        model,
        message: Option.getOrUndefined(message),
      })
    },
  },
  devTools: { Message },
})

Runtime.run(application)
