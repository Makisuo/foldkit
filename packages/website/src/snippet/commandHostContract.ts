import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import { Editor } from './name'

export const Message = defineMessageUnion({
  SucceededSaveDocument: {},
  FailedSaveDocument: { reason: Schema.String },
})

export const SaveDocument = Editor.command('SaveDocument', {
  args: { contents: Schema.String },
  messages: [Message.SucceededSaveDocument, Message.FailedSaveDocument],
})
