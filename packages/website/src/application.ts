import { Layer } from 'effect'

import { LoadPlayground, children } from './connection'
import { ApplicationDefinition } from './definition'
import * as Root from './root'
import * as Subscriptions from './subscription'

export const Application = ApplicationDefinition.register({ children })

export const EffectsLayer = Layer.mergeAll(
  Root.EffectsLayer,
  LoadPlayground.layer,
  Subscriptions.EffectsLayer,
)
