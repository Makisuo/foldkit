import { contract } from './definition'
import * as Effects from './effectsLayer'
import * as Lifecycle from './lifecycle'
import * as Main from './main'

const descriptor = contract.compose({
  init: Main.init,
  update: Main.update,
  subscriptions: Lifecycle.subscriptions,
  managedResources: Lifecycle.managedResources,
  EffectsLayer: Effects.EffectsLayer,
})

export const init = descriptor.init
export const update = descriptor.update
export const mounts = descriptor.mounts
export const subscriptions = descriptor.subscriptions
export const managedResources = descriptor.managedResources
export const EffectsLayer = descriptor.EffectsLayer
