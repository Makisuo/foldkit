import type { Block } from 'foldkit'

import { SkillsEntryComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  SkillsEntryComposition.assembleBlock({
    init,
    update,
    view,
    operations: { requestRevealErrors: Message.RequestedRevealErrors },
  })
export const SkillsEntryBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assemble
> = assemble()
