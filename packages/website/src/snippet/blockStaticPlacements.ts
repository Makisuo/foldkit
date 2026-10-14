import * as Composer from './composer'
import { ChatDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'

export const primaryComposer = ChatDefinition.bindChild(Composer.block, {
  field: 'primaryComposer',
  placement: 'PrimaryComposer',
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const secondaryComposer = ChatDefinition.bindChild(Composer.block, {
  field: 'secondaryComposer',
  placement: 'SecondaryComposer',
  parentMessage: Message.GotSecondaryComposerMessage,
})
