import { Layer } from 'effect'

import * as Command from './command'
import { Home } from './composition'

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  Home.NavigateToRoom.layer,
)
