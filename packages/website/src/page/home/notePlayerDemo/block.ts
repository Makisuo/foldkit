import type { Block } from 'foldkit'

import { NotePlayerDemoComposition } from './composition'
import type { Model } from './definition'
import {
  EffectsLayer,
  init,
  managedResources,
  update,
  view,
} from './notePlayerDemo'

const assembleNotePlayerDemoBlock = () =>
  NotePlayerDemoComposition.assembleBlock({
    init,
    update,
    view,
    managedResources,
    EffectsLayer,
  })

export const NotePlayerDemoBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleNotePlayerDemoBlock
> = assembleNotePlayerDemoBlock()
