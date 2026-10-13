import { init } from './init'
import { ui, update } from './update'

export const block = ui.assemble({
  init,
  update,
})
