import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { defineTaggedUnion } from 'foldkit/schema'
import { modifyFields } from 'foldkit/struct'

const SaveState = defineTaggedUnion({
  Idle: {},
  Saving: {},
  Saved: {},
  Failed: { reason: Schema.String },
})

export const Model = Schema.Struct({ contents: Schema.String, save: SaveState })

export const Message = defineMessageUnion({
  ClickedSave: {},
  SucceededSaveDocument: {},
  FailedSaveDocument: { reason: Schema.String },
})

const Editor = Block.define('Editor', { Model, Message })
const EditorComposition = Editor.toComposition()

export const SaveDocument = Editor.command('SaveDocument', {
  args: { contents: Schema.String },
  messages: [Message.SucceededSaveDocument, Message.FailedSaveDocument],
})

const init = EditorComposition.init((contents: string) => ({
  model: { contents, save: SaveState.Idle() },
}))

const update = EditorComposition.update((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({
      model: modifyFields(model, { save: () => SaveState.Saving() }),
      commands: [SaveDocument({ contents: model.contents })],
    }),
    SucceededSaveDocument: () => ({
      model: modifyFields(model, { save: () => SaveState.Saved() }),
    }),
    FailedSaveDocument: ({ reason }) => ({
      model: modifyFields(model, { save: () => SaveState.Failed({ reason }) }),
    }),
  }),
)

export const block = EditorComposition.toBlock({
  init,
  update,
  hostHandlers: [SaveDocument],
})
