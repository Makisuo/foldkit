import { search } from './block'
import { init } from './init'
import { EffectsLayer } from './layer'
import { informRouteChanged, open, update } from './update'
import { view } from './view'

export const block = search.assemble({
  init,
  update,
  view,
  steps: { informRouteChanged, open },
  EffectsLayer,
})
