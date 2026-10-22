import type { Block } from 'foldkit'

import { HomeComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import type { Model } from './model'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const assembleHomeBlock = () =>
  HomeComposition.assembleBlock({
    init,
    update,
    view,
    subscriptions,
    EffectsLayer,
  })

export const HomeBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleHomeBlock
> = assembleHomeBlock()
