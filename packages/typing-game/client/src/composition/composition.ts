import type { Block } from 'foldkit'

import { ApplicationDefinition } from '../definition'
import { HomeBinding } from './home'
import { RoomBinding } from './room'

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [HomeBinding, RoomBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
