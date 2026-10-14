import { Home } from './definition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const block = Home.toComposition().toBlock({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
})
