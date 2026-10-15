import { Application } from './definition'

const foldSearchOutMessage = Search.OutMessage.match<
  Update.Step<Model, Message>
>({
  RestoredQuery:
    ({ query }) =>
    model => ({
      model: modifyFields(model, {
        maybeRestoredQuery: () => Option.some(query),
      }),
    }),
})

const foldEditorOutMessage = Editor.OutMessage.match<
  Update.Step<Model, Message>
>({
  RestoredDraft:
    ({ documentId }) =>
    model => ({
      model: modifyFields(model, {
        maybeRestoredDocumentId: () => Option.some(documentId),
      }),
    }),
})

const search = Application.bindChild(Search.block, {
  field: 'search',
  parentMessage: Message.GotSearchMessage,
  outMessage: { fold: foldSearchOutMessage },
})

const editor = Application.bindChild(Editor.block, {
  field: 'editor',
  parentMessage: Message.GotEditorMessage,
  outMessage: { fold: foldEditorOutMessage },
})

const init = Application.init(() => {
  const searchInit = search.init()
  const editorInit = editor.init()
  const initialModel = Model.make({
    search: searchInit.model,
    editor: editorInit.model,
    maybeRestoredQuery: Option.none(),
    maybeRestoredDocumentId: Option.none(),
  })

  const startup = Update.combine(initialModel, [
    search.restore(),
    editor.restore(),
  ])

  return {
    model: startup.model,
    commands: [
      ...(searchInit.commands ?? []),
      ...(editorInit.commands ?? []),
      ...(startup.commands ?? []),
    ],
  }
})
