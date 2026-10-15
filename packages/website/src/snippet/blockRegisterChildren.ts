import * as Composer from './composer'
import { Chat } from './definition'
import { Message } from './message'

export const primaryComposer = Chat.bindChild(Composer.block, {
  field: 'primaryComposer',
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const secondaryComposer = Chat.bindChild(Composer.block, {
  field: 'secondaryComposer',
  parentMessage: Message.GotSecondaryComposerMessage,
})

export const ChatComposition = Chat.toComposition({
  children: [primaryComposer, secondaryComposer],
})
