import { Message } from '../../message'
import type { Model } from '../../model'
import { settings } from './bindings'

GotSettingsMessage: ({ message }) =>
  settings.fold(model, message, { currentUser: model.currentUser })
