import { ApiReferenceComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const ApiReferenceBlock = ApiReferenceComposition.assembleBlock({
  init,
  update,
  view,
  operations: {
    informRouteChanged: Message.InformedOfRouteChange,
  },
  EffectsLayer,
})
