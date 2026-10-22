import type { Block } from 'foldkit'

import { SnippetCopyComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { EffectsLayer, update } from './update'
import { view } from './view'

const assembleSnippetCopyBlock = () =>
  SnippetCopyComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })

export const SnippetCopyBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleSnippetCopyBlock
> = assembleSnippetCopyBlock()
