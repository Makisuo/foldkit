import { ApplicationComposition } from './composition'
import { ConnectionState } from './model'

export const init = ApplicationComposition.init(() => ({
  model: {
    connection: ConnectionState.Disconnected(),
    messages: [],
    messageInput: '',
  },
}))
