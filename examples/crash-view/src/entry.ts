import { Option } from 'effect'
import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  Message,
  crashView,
  init,
  update,
  view,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
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
