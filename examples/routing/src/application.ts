import { Layer } from 'effect'
import type { Block } from 'foldkit'

import { LoadExternal, NavigateInternal } from './command'
import { Application } from './definition'
import { Message } from './message'
import { People } from './page'
import { subscriptions } from './subscription'

export const peoplePage = Application.bindChild(People.block, {
  field: 'peoplePage',
  parentMessage: Message.GotPeopleMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [peoplePage],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
  subscriptions.navigationShortcutPresses.layer,
)
