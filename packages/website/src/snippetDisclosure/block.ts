import { init } from './init'
import { MeasureSnippetHeight } from './mount'
import { update } from './update'
import { SnippetDisclosureComposition, view } from './view'

export const EffectsLayer = MeasureSnippetHeight.layer

export const block = SnippetDisclosureComposition.toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
