import { contract } from './definition'
import { view } from './home'
import { init } from './init'
import * as Effects from './layer'
import { update } from './update'

const descriptor = contract.compose({
  init,
  update,
  view,
  EffectsLayer: Effects.EffectsLayer,
})

export const bind = descriptor.bind
export const withEffectsLayer = descriptor.withEffectsLayer
export const EffectsLayer = descriptor.EffectsLayer
export const mounts = descriptor.mounts
export const managedResources = descriptor.managedResources
