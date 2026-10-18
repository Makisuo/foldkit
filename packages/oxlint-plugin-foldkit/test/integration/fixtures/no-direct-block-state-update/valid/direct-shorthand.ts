import { Option, Schema } from 'effect'
import { Update, makeApplicationDefinition } from 'foldkit'
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
  ClickedApplyThemes: {},
})
const ApplicationDefinition = makeApplicationDefinition({ Model, Message })
const EntriesBinding = ApplicationDefinition.bindChild(KeyedEntry.Entry, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    Message.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: Message.GotEntryMessage,
    args: (_model, { id, message }) => Option.some([id, message]),
  },
})
const MaybeSettingsBinding = ApplicationDefinition.bindChild(BoundSettings.Settings, {
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
})
const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [EntriesBinding, MaybeSettingsBinding],
})

export const initial: Model = Model.make({
  entries: [],
  maybeSettings: Option.none(),
})

export const updateWithNamedOperations = ApplicationComposition.makeUpdate(model =>
  Update.combine(model, [
    EntriesBinding.informThemeChanged('initial', { theme: 'Light' }),
    MaybeSettingsBinding.informThemeChanged({ theme: 'Dark' }),
  ])
)
