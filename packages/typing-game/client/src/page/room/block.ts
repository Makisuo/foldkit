import { RoomComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { Message } from './message'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const block = RoomComposition.makeBlock({
  init,
  update,
  view,
  operations: { informJoined: Message.InformedOfJoin },
  subscriptions,
  EffectsLayer,
})
