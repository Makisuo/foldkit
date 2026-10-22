import type { Block } from 'foldkit'

import { EffectsLayer } from './command'
import { WorkHistoryComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assembleWorkHistoryBlock = () =>
  WorkHistoryComposition.assembleBlock({
    init,
    update,
    view,
    operations: { requestRevealErrors: Message.RequestedRevealErrors },
    EffectsLayer,
  })

export const WorkHistoryBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleWorkHistoryBlock
> = assembleWorkHistoryBlock()
