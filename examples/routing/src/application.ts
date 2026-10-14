import { Layer } from 'effect'

import { peoplePage } from './childBindings'
import { LoadExternal, NavigateInternal } from './command'
import { Application } from './definition'
import { subscriptions } from './subscription'

export const ApplicationComposition = Application.toComposition({
  children: [peoplePage],
})

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
  subscriptions.navigationShortcutPresses.layer,
)
