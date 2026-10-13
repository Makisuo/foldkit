import { init } from './init'
import { update, ui } from './update'

export const block = ui.assemble({
  init,
  update,
})
