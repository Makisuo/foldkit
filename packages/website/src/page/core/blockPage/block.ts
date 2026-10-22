import type { Block } from 'foldkit'

import { BlockPageComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  BlockPageComposition.assembleBlock({
    init,
    update,
    view,
  })
export const BlockPageBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = assemble()
