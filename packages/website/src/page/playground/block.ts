import type { Block } from 'foldkit'

import { PlaygroundComposition } from './composition'
import type { Model } from './definition'
import { Message } from './definition'
import {
  EffectsLayer,
  init,
  managedResources,
  update,
  view,
} from './playground'

const assemblePlaygroundBlock = () =>
  PlaygroundComposition.assembleBlock({
    init,
    update,
    view,
    managedResources,
    EffectsLayer,
    operations: { informSupport: Message.InformedOfSupport },
  })

export const PlaygroundBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemblePlaygroundBlock
> = assemblePlaygroundBlock()
