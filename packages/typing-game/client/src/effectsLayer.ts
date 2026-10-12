import { Layer } from 'effect'

import { NavigateToRoom } from './command'
import { LoadExternal, NavigateInternal } from './update'

export const EffectsLayer = Layer.mergeAll(
  NavigateToRoom.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
