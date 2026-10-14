import { FetchPeople, PushSearchUrl } from './command'
import { PeopleDefinition } from './definition'
import { informRouteChanged, init, update } from './update'
import { view } from './view'

export const EffectsLayer = Layer.mergeAll(
  PushSearchUrl.layer,
  FetchPeople.layer,
)

export const block = PeopleDefinition.toComposition().toBlock({
  init,
  update,
  view,
  EffectsLayer,
  expose: { informRouteChanged },
})
import { Layer } from 'effect'
