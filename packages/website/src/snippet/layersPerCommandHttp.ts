import { Http, Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import { Application, init, update, view } from './application'
import { Message } from './message'

export const ApplicationLayer = Http.layer

const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(provide(application, ApplicationLayer))
