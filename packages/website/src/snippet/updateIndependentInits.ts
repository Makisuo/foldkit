import {
  WorkspaceComposition,
  SearchBinding,
  EditorBinding,
} from './composition'
const init = WorkspaceComposition.init(() => ({
  model: {
    maybeSelectedDocumentId: Option.none(),
    maybeOpenedDocumentId: Option.none(),
  },
  steps: [SearchBinding.restore(), EditorBinding.restore()],
}))
