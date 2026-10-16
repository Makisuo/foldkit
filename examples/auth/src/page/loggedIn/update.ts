import { LoggedInComposition } from './definition'
import { Message, OutMessage } from './message'

export const update = LoggedInComposition.update((model, message) =>
  Message.match(message, {
    ClickedLogout: () => ({
      model,
      outMessage: OutMessage.RequestedLogout(),
    }),
  }),
)
