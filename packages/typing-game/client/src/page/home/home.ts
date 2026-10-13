import { Home } from './block'
import { init } from './init'
import { EffectsLayer as LocalEffectsLayer } from './layer'
import { subscriptions as localSubscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

export const block = Home.assemble({
  init,
  update,
  view,
  subscriptions: localSubscriptions,
  EffectsLayer: LocalEffectsLayer,
})
