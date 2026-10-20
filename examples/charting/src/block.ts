import { ApplicationComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { update } from './update'
import { view } from './view'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
  EffectsLayer,
})
