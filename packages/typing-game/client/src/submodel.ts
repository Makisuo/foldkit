import { contract } from './definition'
import { EffectsLayer as LocalEffectsLayer } from './effectsLayer'
import { init as initialize } from './init'
import { update as updateModel } from './update'

const descriptor = contract.compose({
  init: initialize,
  update: updateModel,
  EffectsLayer: LocalEffectsLayer,
})

export type Descriptor = typeof descriptor

export const init = descriptor.init
export const update = descriptor.update
export const subscriptions = descriptor.subscriptions
export const managedResources = descriptor.managedResources
export const mounts = descriptor.mounts
export const EffectsLayer = descriptor.EffectsLayer
