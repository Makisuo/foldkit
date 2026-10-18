import { Layer } from 'effect'

import { FetchPeople, PushSearchUrl } from './command'
import { PeopleComposition } from './composition'
import { Message } from './message'
import { init, update } from './update'
import { view } from './view'

export const EffectsLayer = Layer.mergeAll(
  PushSearchUrl.layer,
  FetchPeople.layer,
)

export const block = PeopleComposition.makeBlock({
  init,
  update,
  view,
  EffectsLayer,
  operations: { informRouteChanged: Message.InformedOfRouteChange },
})
