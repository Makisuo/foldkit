import { SnippetCopy } from './definition'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = SnippetCopy.toComposition().toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
