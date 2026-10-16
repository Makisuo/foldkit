import { modifyFields } from 'foldkit/struct'

import { BlockPageComposition } from './definition'
import { Message } from './message'

export const update = BlockPageComposition.update((model, message) =>
  Message.match(message, {
    ToggledMapMessagesUnderHood: ({ isOpen }) => ({
      model: modifyFields(model, { isMapMessagesUnderHoodOpen: () => isOpen }),
    }),
  }),
)
