import type { Block } from 'foldkit'

import { AttachmentsComposition } from './composition'
import type { Model } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  AttachmentsComposition.assembleBlock({
    init,
    update,
    view,
  })
export const AttachmentsBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = assemble()
