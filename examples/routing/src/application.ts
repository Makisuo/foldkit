import { Layer } from 'effect'
import type { Block } from 'foldkit'

import { peoplePage } from './childBindings'
import { LoadExternal, NavigateInternal } from './command'
import { Application } from './definition'
import { subscriptions } from './subscription'

export const ApplicationComposition = Application.toComposition({
  children: [peoplePage],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
  subscriptions.navigationShortcutPresses.layer,
)
