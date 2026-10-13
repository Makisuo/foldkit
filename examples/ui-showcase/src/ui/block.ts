import { init } from './init'
import { closeMobileMenu, openMobileMenu, ui, update } from './update'

export const block = ui.assemble({
  init: init,
  update: update,
  steps: { openMobileMenu, closeMobileMenu },
})
