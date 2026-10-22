import type { Block } from 'foldkit'

import { ComingFromReactComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleComingFromReactBlock = () =>
  ComingFromReactComposition.assembleBlock({
    init,
    update,
    view,
  })

export const ComingFromReactBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleComingFromReactBlock
> = assembleComingFromReactBlock()
