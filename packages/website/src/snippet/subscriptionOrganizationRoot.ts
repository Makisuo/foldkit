import { ApplicationComposition, init, update, view } from './application'
import { Message } from './message'

export const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})
