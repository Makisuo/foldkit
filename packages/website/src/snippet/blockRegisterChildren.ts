import * as Composer from './composer'
import { ChatDefinition } from './definition'
import { Message } from './message'

export const PrimaryComposerBinding = ChatDefinition.bindChild(Composer.block, {
  field: 'primaryComposer',
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const SecondaryComposerBinding = ChatDefinition.bindChild(
  Composer.block,
  {
    field: 'secondaryComposer',
    parentMessage: Message.GotSecondaryComposerMessage,
  },
)

export const ChatComposition = ChatDefinition.makeComposition({
  childBindings: [PrimaryComposerBinding, SecondaryComposerBinding],
})
