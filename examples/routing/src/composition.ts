import type { Block } from 'foldkit'

import { Application } from './definition'
import { Message } from './message'
import { People } from './page'

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
