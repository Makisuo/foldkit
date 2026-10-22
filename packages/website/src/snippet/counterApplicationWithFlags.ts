import type { Block } from 'foldkit'

import type { Model } from './counterFlagsRoot'
import { ApplicationComposition, init, update, view } from './counterFlagsRoot'

const assemble = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
  })
export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = assemble()
