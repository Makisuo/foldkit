import type { Block } from 'foldkit'

import { WorkHistoryEntryComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assembleWorkHistoryEntryBlock = () =>
  WorkHistoryEntryComposition.assembleBlock({
    init,
    update,
    view,
    operations: { requestRevealErrors: Message.RequestedRevealErrors },
  })

export const WorkHistoryEntryBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleWorkHistoryEntryBlock
> = assembleWorkHistoryEntryBlock()
