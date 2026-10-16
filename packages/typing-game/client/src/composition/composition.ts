import type { Block } from 'foldkit'

import { Application } from '../definition'
import * as Home from './home'
import * as Room from './room'

export const RoomBinding = Room.RoomBinding
export const HomeBinding = Home.bind({ informJoined: RoomBinding.informJoined })

export const ApplicationComposition = Application.toComposition({
  childBindings: [HomeBinding, RoomBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
