import type { Block } from 'foldkit'

import { Application } from './definition'
import { Message } from './message'
import { People } from './page'
import type { PeopleRoute } from './route'

export const PeoplePageBinding = Application.bindChild(People.block, {
  field: 'peoplePage',
  parentMessage: Message.GotPeopleMessage,
  init: { args: (route: PeopleRoute) => [route] },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [PeoplePageBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
