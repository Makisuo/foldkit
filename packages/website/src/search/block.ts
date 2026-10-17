import { SearchComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

const open = SearchComposition.makeOperation(Message.RequestedOpen)
const informRouteChanged = SearchComposition.makeOperation(
  Message.InformedOfRouteChange,
)

export const block = SearchComposition.makeBlock({
  init,
  update,
  view,
  operations: { open, informRouteChanged },
  EffectsLayer,
})
