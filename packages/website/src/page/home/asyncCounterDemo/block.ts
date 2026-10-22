import type { Block } from 'foldkit'

import {
  AsyncCounterDemoComposition,
  EffectsLayer,
  init,
  update,
  view,
} from './asyncCounterDemo'
import type { Model } from './definition'

const assembleAsyncCounterDemoBlock = () =>
  AsyncCounterDemoComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })

export const AsyncCounterDemoBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleAsyncCounterDemoBlock
> = assembleAsyncCounterDemoBlock()
