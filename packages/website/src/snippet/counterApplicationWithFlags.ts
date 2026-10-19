import { ApplicationComposition, init, update, view } from './counterFlagsRoot'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
})
