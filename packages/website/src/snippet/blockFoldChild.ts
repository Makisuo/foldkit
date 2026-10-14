import { settings } from './childBindings'
import { Application } from './definition'
import { Message } from './message'

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotSettingsMessage: ({ message }) => settings.fold(model, message),
  }),
)
