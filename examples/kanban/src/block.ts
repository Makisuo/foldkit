import { EffectsLayer } from './command'
import { ApplicationComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
  EffectsLayer,
})
