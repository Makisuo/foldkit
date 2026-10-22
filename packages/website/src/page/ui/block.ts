import type { Block } from 'foldkit'

import { UiComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleUiBlock = () =>
  UiComposition.assembleBlock({
    init,
    update,
    view,
  })

export const UiBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleUiBlock
> = assembleUiBlock()
