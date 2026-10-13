import { LoggedIn } from './block'
import { Message, OutMessage } from './message'

export const update = LoggedIn.update((model, message) =>
  Message.match(message, {
    ClickedLogout: () => ({
      model,
      outMessage: OutMessage.RequestedLogout(),
    }),
  }),
)
