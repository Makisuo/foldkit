import type { Block } from 'foldkit'

import { ApplicationComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleApplicationBlock = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })

export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleApplicationBlock
> = assembleApplicationBlock()
