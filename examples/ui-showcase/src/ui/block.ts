import type { Block } from 'foldkit'

import { UiComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import type { Model } from './model'
import { update } from './update'

const assemble = () =>
  UiComposition.assembleBlock({
    init,
    update,
    operations: {
      requestOpenMobileMenu: Message.RequestedOpenMobileMenu,
      requestCloseMobileMenu: Message.RequestedCloseMobileMenu,
    },
  })
export const UiBlock: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assemble
> = assemble()
