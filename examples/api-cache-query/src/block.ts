import { ApplicationComposition } from './composition'
import { init } from './init'
import { EffectsLayer, subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
})
