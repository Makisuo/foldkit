import { Application } from './definition'
import { ConnectionState } from './model'

export const init = Application.init(() => ({
  model: {
    connection: ConnectionState.Disconnected(),
    messages: [],
    messageInput: '',
  },
}))
