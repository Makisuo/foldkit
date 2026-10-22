import type { Block } from 'foldkit'

import { LoggedOutComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleLoggedOutBlock = () =>
  LoggedOutComposition.assembleBlock({
    init,
    update,
    view,
  })

export const LoggedOutBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleLoggedOutBlock
> = assembleLoggedOutBlock()
