import type { Block } from 'foldkit'

import { Application } from '../definition'
import * as Home from './home'
import * as Room from './room'

export const room = Room.room
export const home = Home.bind({ informJoined: room.informJoined })

export const ApplicationComposition = Application.toComposition({
  children: [home, room],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
