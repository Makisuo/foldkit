// block.ts
import { Block } from 'foldkit'

import { ApplicationComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const assemble = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
    subscriptions,
  })
export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)

// entry.ts
import { Program } from 'foldkit'

import { ApplicationBlock } from './block'

export const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { dispatch: true },
})
