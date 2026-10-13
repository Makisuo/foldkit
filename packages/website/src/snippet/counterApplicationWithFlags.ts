import { Application, init, update, view } from './application'
import { Flags } from './flags'

const application = Application.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})
