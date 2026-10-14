import { Layer } from 'effect'

import { LoadPlayground, children } from './childBindings'
import { Application } from './definition'
import * as Root from './root'
import * as Subscriptions from './subscription'

export const ApplicationComposition = Application.toComposition({
  children,
})

export const EffectsLayer = Layer.mergeAll(
  Root.EffectsLayer,
  LoadPlayground.layer,
  Subscriptions.EffectsLayer,
)
