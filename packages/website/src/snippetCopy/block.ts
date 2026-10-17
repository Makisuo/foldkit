import { SnippetCopyComposition } from './composition'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = SnippetCopyComposition.makeBlock({
  init,
  update,
  view,
  EffectsLayer,
})
