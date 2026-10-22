import { Block } from 'foldkit'

import { LoginComposition } from './composition'
import type { Model } from './definition'
import { EffectsLayer, init, update } from './login'
import { view } from './view'

const assemble = () =>
  LoginComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })
export const LoginBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
