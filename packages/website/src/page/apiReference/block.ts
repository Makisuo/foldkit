import { Option } from 'effect'

import { ApiReferenceComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import type { ApiData } from './model'
import { EffectsLayer, update } from './update'
import { view } from './view'

export const block = ApiReferenceComposition.makeBlock({
  init,
  update,
  view,
  operations: {
    requestLoadInitialData: (
      maybeApiData: Option.Option<ApiData> = Option.none(),
    ) => [Message.RequestedLoadInitialData({ maybeApiData })],
    informRouteChanged: Message.InformedOfRouteChange,
  },
  EffectsLayer,
})
