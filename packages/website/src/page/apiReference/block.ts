import { ApiReferenceComposition } from './definition'
import { boot, init } from './init'
import { EffectsLayer, informRouteChanged, update } from './update'
import { view } from './view'

export const block = ApiReferenceComposition.toBlock({
  init,
  update,
  view,
  expose: { boot, informRouteChanged },
  EffectsLayer,
})
