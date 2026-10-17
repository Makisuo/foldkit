import { UiComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import { update } from './update'

const openMobileMenu = UiComposition.makeOperation(
  Message.RequestedOpenMobileMenu,
)

const closeMobileMenu = UiComposition.makeOperation(
  Message.RequestedCloseMobileMenu,
)

export const block = UiComposition.makeBlock({
  init,
  update,
  operations: { openMobileMenu, closeMobileMenu },
})
