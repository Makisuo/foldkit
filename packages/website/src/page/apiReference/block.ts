import { Option } from 'effect'

import { ApiReferenceComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import type { ApiData } from './model'
import { EffectsLayer, update } from './update'
import { view } from './view'

const informRouteChanged = ApiReferenceComposition.makeOperation(
  Message.InformedOfRouteChange,
)

export const block = ApiReferenceComposition.makeBlock({
  init,
  update,
  view,
  operations: {
    loadInitialData: (maybeApiData: Option.Option<ApiData> = Option.none()) => [
      Message.RequestedLoadInitialData({ maybeApiData }),
    ],
    informRouteChanged,
  },
  EffectsLayer,
})
