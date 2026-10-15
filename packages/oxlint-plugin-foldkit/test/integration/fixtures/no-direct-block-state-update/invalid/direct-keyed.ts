import { Array, Schema } from 'effect'
import { Update, defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import * as KeyedEntry from './keyedEntry'

const Model = Schema.Struct({ entries: Schema.Array(KeyedEntry.Model) })
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotEntryMessage: { id: Schema.String, message: KeyedEntry.Message },
})
const Application = defineApplication({ Model, Message })
const entries = Application.bindChild(KeyedEntry.Entry, {
  field: 'entries',
  key: 'id',
  toParentMessage: (id, message) =>
    Message.GotEntryMessage({ id, message }),
})

export const updateEntryManually = (model: Model) => {
  const entryUpdate = Update.combine(model, [
    entries.setTheme('initial', 'Light'),
  ])

  return {
    model: modifyFields(model, {
      entries: Array.map(entry =>
        modifyFields(entry, { theme: () => 'Dark' }),
      ),
    }),
    commands: entryUpdate.commands,
  }
}
