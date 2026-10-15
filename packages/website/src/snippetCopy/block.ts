import { SnippetCopyComposition } from './definition'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = SnippetCopyComposition.toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
