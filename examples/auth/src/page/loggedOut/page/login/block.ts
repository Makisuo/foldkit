import type { Block } from 'foldkit'

import { LoginComposition } from './composition'
import type { Model } from './definition'
import { EffectsLayer, init, update } from './login'
import { view } from './view'

const assembleLoginBlock = () =>
  LoginComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })

export const LoginBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleLoginBlock
> = assembleLoginBlock()
