import { init } from './init'
import { MeasureSnippetHeight } from './mount'
import { update } from './update'
import { RegisteredSnippetDisclosureDefinition, view } from './view'

export const EffectsLayer = MeasureSnippetHeight.layer

export const block = RegisteredSnippetDisclosureDefinition.toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
