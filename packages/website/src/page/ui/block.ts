import { init } from './init'
import { UiComposition, update } from './update'

export const block = UiComposition.toBlock({
  init,
  update,
})
