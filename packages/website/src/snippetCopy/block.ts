import { SnippetCopyDefinition } from './definition'
import { init } from './init'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = SnippetCopyDefinition.toComposition().toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
