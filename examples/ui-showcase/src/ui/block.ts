import { UiComposition } from './composition'
import { init } from './init'
import { closeMobileMenu, openMobileMenu, update } from './update'

export const block = UiComposition.toBlock({
  init,
  update,
  expose: { openMobileMenu, closeMobileMenu },
})
