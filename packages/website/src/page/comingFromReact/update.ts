import { Record } from 'effect'

import { ComingFromReactDefinition } from './definition'
import { Message } from './message'

export const update = ComingFromReactDefinition.update((model, message) =>
  Message.match(message, {
    ToggledFaq: ({ id, isOpen }) => ({ model: Record.set(model, id, isOpen) }),
  }),
)
