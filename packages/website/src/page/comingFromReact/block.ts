import { Block } from 'foldkit'

import { ComingFromReactComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  ComingFromReactComposition.assembleBlock({
    init,
    update,
    view,
  })
export const ComingFromReactBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
