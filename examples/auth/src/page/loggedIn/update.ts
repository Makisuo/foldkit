import { LoggedInDefinition } from './definition'
import { Message, OutMessage } from './message'

export const update = LoggedInDefinition.update((model, message) =>
  Message.match(message, {
    ClickedLogout: () => ({
      model,
      outMessage: OutMessage.RequestedLogout(),
    }),
  }),
)
