import { Room } from './block'
import { init } from './init'
import { EffectsLayer as LocalEffectsLayer } from './layer'
import { subscriptions as localSubscriptions } from './subscription'
import { informJoined, update } from './update'
import { view } from './view'

export const block = Room.assemble({
  init,
  update,
  view,
  steps: { informJoined },
  subscriptions: localSubscriptions,
  EffectsLayer: LocalEffectsLayer,
})
