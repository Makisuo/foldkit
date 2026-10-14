import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import * as Settings from './blockSettings'

export const Model = Schema.Struct({
  currentUser: Schema.Struct({ accountId: Schema.String }),
  maybeSettings: Schema.Option(Settings.Model),
  previewTheme: Settings.Theme,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSettingsMessage: { message: Settings.Message },
})
export type Message = typeof Message.Type
