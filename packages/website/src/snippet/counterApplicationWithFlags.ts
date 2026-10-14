import { ApplicationDefinition, init, update, view } from './counterFlagsRoot'
import { Flags } from './flagsDefinition'

export const application = ApplicationDefinition.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})
