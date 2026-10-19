import { ApplicationComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { managedResources } from './managedResource'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
  subscriptions,
  managedResources,
  EffectsLayer,
})
