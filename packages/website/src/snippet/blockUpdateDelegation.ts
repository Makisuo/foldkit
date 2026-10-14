import { settings } from './childBindings'
import { ApplicationDefinition } from './definition'
import { Message } from './message'

export const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    GotSettingsMessage: ({ message }) => settings.fold(model, message),
  }),
)
