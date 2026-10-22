import { Block } from 'foldkit'

import { NotePlayerDemoComposition } from './composition'
import type { Model } from './definition'
import {
  EffectsLayer,
  init,
  managedResources,
  update,
  view,
} from './notePlayerDemo'

const assemble = () =>
  NotePlayerDemoComposition.assembleBlock({
    init,
    update,
    view,
    managedResources,
    EffectsLayer,
  })
export const NotePlayerDemoBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
