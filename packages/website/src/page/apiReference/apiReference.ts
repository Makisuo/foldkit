import { ApiReferenceDefinition } from './definition'
import { boot, init } from './init'
import { EffectsLayer, informRouteChanged, update } from './update'
import { view } from './view'

export const block = ApiReferenceDefinition.toBlock({
  init,
  update,
  view,
  expose: { boot, informRouteChanged },
  EffectsLayer,
})
