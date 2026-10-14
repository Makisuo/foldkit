import { modifyFields } from 'foldkit/struct'

import { BlockPage } from './definition'
import { Message } from './message'

export const update = BlockPage.update((model, message) =>
  Message.match(message, {
    ToggledMapMessagesUnderHood: ({ isOpen }) => ({
      model: modifyFields(model, { isMapMessagesUnderHoodOpen: () => isOpen }),
    }),
  }),
)
