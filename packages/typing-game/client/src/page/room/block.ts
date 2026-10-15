import { Room } from './definition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { subscriptions } from './subscription'
import { informJoined, update } from './update'
import { view } from './view'

export const block = Room.toComposition().toBlock({
  init,
  update,
  view,
  expose: { informJoined },
  subscriptions,
  EffectsLayer,
})
