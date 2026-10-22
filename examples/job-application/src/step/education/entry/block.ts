import type { Block } from 'foldkit'

import { EducationEntryComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  EducationEntryComposition.assembleBlock({
    init,
    update,
    view,
    operations: { requestRevealErrors: Message.RequestedRevealErrors },
  })
export const EducationEntryBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assemble
> = assemble()
