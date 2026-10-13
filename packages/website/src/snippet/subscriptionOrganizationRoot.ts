import { Application, init, update, view } from './application'
import { Message } from './message'

export const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})
