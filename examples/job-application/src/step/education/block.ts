import type { Block } from 'foldkit'

import { EffectsLayer } from './command'
import { EducationComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  EducationComposition.assembleBlock({
    init,
    update,
    view,
    operations: { requestRevealErrors: Message.RequestedRevealErrors },
    EffectsLayer,
  })
export const EducationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = assemble()
