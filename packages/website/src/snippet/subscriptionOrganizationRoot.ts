// block.ts
import type { Block } from 'foldkit'

import { ApplicationComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const assembleApplicationBlock = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
    subscriptions,
  })

export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleApplicationBlock
> = assembleApplicationBlock()

// entry.ts
import { Program } from 'foldkit'

import { ApplicationBlock } from './block'

export const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { dispatch: true },
})
