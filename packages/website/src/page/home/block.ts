import type { Block } from 'foldkit'

import { HomeComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

export { view } from './view'

const assembleHomeBlock = () =>
  HomeComposition.assembleBlock({
    init,
    update,
    view,
  })

export const HomeBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleHomeBlock
> = assembleHomeBlock()
