import { SnippetCopy } from './block'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = SnippetCopy.assemble({
  init,
  update,
  view,
  EffectsLayer,
})
