import { Layer } from 'effect'

import * as Command from './command'
import { Home } from './composition'

export { Application } from './definition'

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  Home.NavigateToRoom.layer,
)
