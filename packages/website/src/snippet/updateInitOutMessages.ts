const OutMessage = defineMessageUnion({
  RestoredSearch: { query: Schema.String },
  RestoredEditor: { documentId: Schema.String },
})

const search = Application.bindChild(Search.block, {
  field: 'search',
  parentMessage: Message.GotSearchMessage,
  outMessage: {
    forward: Search.OutMessage.match({
      RestoredQuery: ({ query }) => OutMessage.RestoredSearch({ query }),
    }),
  },
})

const editor = Application.bindChild(Editor.block, {
  field: 'editor',
  parentMessage: Message.GotEditorMessage,
  outMessage: {
    forward: Editor.OutMessage.match({
      RestoredDraft: ({ documentId }) =>
        OutMessage.RestoredEditor({ documentId }),
    }),
  },
})

const searchInit = search.init()
const editorInit = editor.init()
const model = Model.make({ search: searchInit.model, editor: editorInit.model })

return Update.combine(model, [search.restore(), editor.restore()])
