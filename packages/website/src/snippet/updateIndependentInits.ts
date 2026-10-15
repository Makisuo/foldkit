import { Workspace } from './definition'

const init = Workspace.init(() => {
  const searchInit = search.init()
  const editorInit = editor.init()

  const model = Model.make({
    search: searchInit.model,
    editor: editorInit.model,
    maybeSelectedDocumentId: Option.none(),
    maybeOpenedDocumentId: Option.none(),
  })

  const startup = Update.combine(model, [search.restore(), editor.restore()])

  return {
    model: startup.model,
    commands: [
      ...(searchInit.commands ?? []),
      ...(editorInit.commands ?? []),
      ...(startup.commands ?? []),
    ],
  }
})
