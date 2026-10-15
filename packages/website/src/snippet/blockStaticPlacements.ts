import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import * as Composer from './composer'
import { Chat } from './definition'
import { Message } from './message'

export const primaryComposer = Chat.bindChild(Composer.block, {
  read: model => Option.some(model.primaryPanel.composer),
  write: (model, nextComposer) =>
    modifyFields(model, {
      primaryPanel: panel =>
        modifyFields(panel, { composer: () => nextComposer }),
    }),
  parentMessage: Message.GotPrimaryComposerMessage,
})

export const secondaryComposer = Chat.bindChild(Composer.block, {
  placement: 'SecondaryComposer',
  read: model => Option.some(model.secondaryPanel.composer),
  write: (model, nextComposer) =>
    modifyFields(model, {
      secondaryPanel: panel =>
        modifyFields(panel, { composer: () => nextComposer }),
    }),
  parentMessage: Message.GotSecondaryComposerMessage,
})
