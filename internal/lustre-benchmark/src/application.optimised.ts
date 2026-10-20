import { ApplicationComposition, init, update } from './application'
import { view } from './view.optimised'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view: ApplicationComposition.makeView(view),
})
