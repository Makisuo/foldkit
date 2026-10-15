import { Layer } from 'effect'
import type { Block } from 'foldkit'

import * as Command from './command'
import * as HomeBinding from './composition/home'
import { room } from './composition/room'
import { Application } from './definition'

export { Application } from './definition'
export { room } from './composition/room'

export const home = HomeBinding.bindHome({ informJoined: room.informJoined })

export const ApplicationComposition = Application.toComposition({
  children: [home, room],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  HomeBinding.NavigateToRoom.layer,
)
