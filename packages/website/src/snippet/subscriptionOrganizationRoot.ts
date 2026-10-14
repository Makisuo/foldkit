import { ApplicationComposition, init, update, view } from './application'
import { Message } from './message'

export const application = ApplicationComposition.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})
