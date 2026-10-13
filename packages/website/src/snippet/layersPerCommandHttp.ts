import { Http, Runtime } from 'foldkit'

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

Runtime.run(application.provide(ApplicationLayer))
