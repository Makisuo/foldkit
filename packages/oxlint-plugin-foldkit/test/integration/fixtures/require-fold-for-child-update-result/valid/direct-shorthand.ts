import { Option, Schema } from 'effect'
import { Update, defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import * as BoundSettings from './boundSettings'
import * as KeyedEntry from './keyedEntry'

const Model = Schema.Struct({
  entries: Schema.Array(KeyedEntry.Model),
  maybeSettings: Schema.Option(BoundSettings.Model),
})
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotEntryMessage: { id: Schema.String, message: KeyedEntry.Message },
  GotSettingsMessage: { message: BoundSettings.Message },
})
const Application = defineApplication({ Model, Message })
const entries = Application.bindChild(KeyedEntry.Entry, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    Message.GotEntryMessage({ id, message }),
})
const maybeSettings = Application.bindChild(BoundSettings.Settings, {
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
})

export const initial: Model = Model.make({
  entries: [],
  maybeSettings: Option.none(),
})

export const updateWithNamedOperations = (model: Model) =>
  Update.combine(model, [
    entries.setTheme('initial', 'Light'),
    maybeSettings.setTheme('Dark'),
  ])
