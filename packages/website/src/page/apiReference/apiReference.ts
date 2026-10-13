import { ApiReference } from './block'
import { boot, init } from './init'
import { EffectsLayer, informRouteChanged, update } from './update'
import { view } from './view'

export const block = ApiReference.assemble({
  init,
  update,
  view,
  steps: { boot, informRouteChanged },
  EffectsLayer,
})
