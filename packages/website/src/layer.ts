import { Layer } from 'effect'

import * as Command from './command'
import { Home } from './composition'
import * as Subscription from './subscription'

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  Home.LoadPlayground.layer,
  Subscription.EffectsLayer,
)
