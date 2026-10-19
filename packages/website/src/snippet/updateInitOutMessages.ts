import { ApplicationDefinition } from './definition'

const foldSearchOutMessage = ApplicationDefinition.makeOutMessageFold(
  Search.SearchBlock,
  {
    RestoredQuery:
      ({ query }) =>
      model => ({
        model: modifyFields(model, {
          maybeRestoredQuery: () => Option.some(query),
        }),
      }),
  },
)

const foldEditorOutMessage = ApplicationDefinition.makeOutMessageFold(
  Editor.EditorBlock,
  {
    RestoredDraft:
      ({ documentId }) =>
      model => ({
        model: modifyFields(model, {
          maybeRestoredDocumentId: () => Option.some(documentId),
        }),
      }),
  },
)

const SearchBinding = ApplicationDefinition.bindChild(Search.SearchBlock, {
  field: 'search',
  outMessage: { fold: foldSearchOutMessage },
})

const EditorBinding = ApplicationDefinition.bindChild(Editor.EditorBlock, {
  field: 'editor',
  outMessage: { fold: foldEditorOutMessage },
})

const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [SearchBinding, EditorBinding],
})

const init = ApplicationComposition.makeInit(() => ({
  model: {
    maybeRestoredQuery: Option.none(),
    maybeRestoredDocumentId: Option.none(),
  },
  steps: [SearchBinding.requestRestore(), EditorBinding.requestRestore()],
}))
