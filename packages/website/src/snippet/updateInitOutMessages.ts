import { ApplicationDefinition } from './definition'

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

const SearchBinding = ApplicationDefinition.bindChild(Search.block, {
  field: 'search',
  parentMessage: Message.GotSearchMessage,
  outMessage: { fold: foldSearchOutMessage },
})

const EditorBinding = ApplicationDefinition.bindChild(Editor.block, {
  field: 'editor',
  parentMessage: Message.GotEditorMessage,
  outMessage: { fold: foldEditorOutMessage },
})

const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [SearchBinding, EditorBinding],
})

const init = ApplicationComposition.makeInit(() => ({
  model: {
    maybeRestoredQuery: Option.none(),
    maybeRestoredDocumentId: Option.none(),
  },
  steps: [SearchBinding.restore(), EditorBinding.restore()],
}))
