import type { Block } from 'foldkit'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { People } from './page'

export const PeoplePageBinding = ApplicationDefinition.bindChild(People.block, {
  field: 'peoplePage',
  parentMessage: Message.GotPeopleMessage,
  init: { startupToArgs: route => [route] },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [PeoplePageBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
