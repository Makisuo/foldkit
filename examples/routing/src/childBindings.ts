import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { People } from './page'

export const peoplePage = ApplicationDefinition.bindChild(People.block, {
  field: 'peoplePage',
  parentMessage: Message.GotPeopleMessage,
})
