import { modifyFields } from 'foldkit/struct'

import { BlockPageDefinition } from './definition'
import { Message } from './message'

export const update = BlockPageDefinition.update((model, message) =>
  Message.match(message, {
    ToggledMapMessagesUnderHood: ({ isOpen }) => ({
      model: modifyFields(model, { isMapMessagesUnderHoodOpen: () => isOpen }),
    }),
  }),
)
