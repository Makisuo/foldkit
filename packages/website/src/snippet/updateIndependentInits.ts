const searchInit = search.init()
const editorInit = editor.init()

const model = Model.make({
  search: searchInit.model,
  editor: editorInit.model,
  maybeSelectedDocumentId: Option.none(),
  maybeOpenedDocumentId: Option.none(),
})

return Update.combine(model, [search.restore(), editor.restore()])
