import { Message } from '../../message'
import type { Model } from '../../model'
import { settings } from './childBindings'

GotSettingsMessage: ({ message }) =>
  settings.fold(model, message, { currentUser: model.currentUser })
