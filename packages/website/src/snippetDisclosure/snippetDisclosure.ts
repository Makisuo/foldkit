import { snippetDisclosure } from './definition'
import { init } from './init'
import { MeasureSnippetHeight } from './mount'
import { update } from './update'
import { view } from './view'

export const EffectsLayer = MeasureSnippetHeight.layer

export const block = snippetDisclosure.assemble({
  init,
  update,
  view,
  EffectsLayer,
})
