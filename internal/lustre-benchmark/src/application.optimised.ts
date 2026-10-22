import { Block } from 'foldkit'

import { ApplicationComposition, init, update } from './application'
import type { Model } from './todo'
import { view } from './view.optimised'

const assemble = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view: ApplicationComposition.makeView(view),
  })
export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
