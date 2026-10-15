import { UiComposition } from './composition'
import { init } from './init'
import { update } from './update'

export const block = UiComposition.toBlock({
  init,
  update,
})
