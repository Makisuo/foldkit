import { contract } from './definition'
import { init } from './init'
import { EffectsLayer as LocalEffectsLayer } from './layer'
import { subscriptions as localSubscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const descriptor = contract.compose({
  init,
  update,
  view,
  subscriptions: localSubscriptions,
  EffectsLayer: LocalEffectsLayer,
})

export type Descriptor = typeof descriptor

export const bind = descriptor.bind
export const withEffectsLayer = descriptor.withEffectsLayer
export const subscriptions = descriptor.subscriptions
export const EffectsLayer = descriptor.EffectsLayer
