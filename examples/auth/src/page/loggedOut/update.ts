import { LoggedOutDefinition, login } from './definition'
import { Message } from './message'

export const update = LoggedOutDefinition.update((model, message) =>
  Message.match(message, {
    GotLoginMessage: ({ message }) => login.fold(model, message),
  }),
)
