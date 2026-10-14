import { Record } from 'effect'

import { ComingFromReact } from './definition'
import { Message } from './message'

export const update = ComingFromReact.update((model, message) =>
  Message.match(message, {
    ToggledFaq: ({ id, isOpen }) => ({ model: Record.set(model, id, isOpen) }),
  }),
)
