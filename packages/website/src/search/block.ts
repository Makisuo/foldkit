import { SearchComposition } from './childBindings'
import { init } from './init'
import { EffectsLayer } from './layer'
import { informRouteChanged, open, update } from './update'
import { view } from './view'

export const block = SearchComposition.toBlock({
  init,
  update,
  view,
  expose: { informRouteChanged, open },
  EffectsLayer,
})
