import type { Block } from 'foldkit'

import { ApplicationComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { EffectsLayer, subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const assembleApplicationBlock = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
    subscriptions,
    EffectsLayer,
  })

export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleApplicationBlock
> = assembleApplicationBlock()
