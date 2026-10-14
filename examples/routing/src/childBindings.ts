import { Application } from './definition'
import { Message } from './message'
import { People } from './page'

export const peoplePage = Application.bindChild(People.block, {
  field: 'peoplePage',
  parentMessage: Message.GotPeopleMessage,
})
