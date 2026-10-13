import { LoggedOut, login } from './block'
import { Message } from './message'

export const update = LoggedOut.update((model, message) =>
  Message.match(message, {
    GotLoginMessage: ({ message }) => login.fold(model, message),
  }),
)
