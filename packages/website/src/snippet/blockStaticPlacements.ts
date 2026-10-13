import * as Composer from './composer'
import { Message } from './message'
import { Model } from './model'

export const primaryComposer = Composer.block.connection({
  Model,
  field: 'primaryComposer',
  placement: 'PrimaryComposer',
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const secondaryComposer = Composer.block.connection({
  Model,
  field: 'secondaryComposer',
  placement: 'SecondaryComposer',
  parentMessage: Message.GotSecondaryComposerMessage,
})
