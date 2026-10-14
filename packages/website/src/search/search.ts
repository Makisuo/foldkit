import { SearchDefinition } from './definition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { informRouteChanged, open, update } from './update'
import { view } from './view'

export const block = SearchDefinition.toBlock({
  init,
  update,
  view,
  expose: { informRouteChanged, open },
  EffectsLayer,
})
