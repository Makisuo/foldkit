import { Layer } from 'effect'

import { NavigateToRoom } from './command'
import { LoadExternal, NavigateInternal } from './update'

export { Application } from './children'
export { init } from './init'
export { Message } from './message'
export { update } from './update'
export { view } from './view'

export const EffectsLayer = Layer.mergeAll(
  NavigateToRoom.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
