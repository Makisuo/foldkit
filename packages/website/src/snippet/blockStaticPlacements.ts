import * as Composer from './composer'
import { Chat } from './definition'
import { Message } from './message'
import { Model } from './model'

export const primaryComposer = Chat.bindChild(Composer.block, {
  field: 'primaryComposer',
  placement: 'PrimaryComposer',
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const secondaryComposer = Chat.bindChild(Composer.block, {
  field: 'secondaryComposer',
  placement: 'SecondaryComposer',
  parentMessage: Message.GotSecondaryComposerMessage,
})
