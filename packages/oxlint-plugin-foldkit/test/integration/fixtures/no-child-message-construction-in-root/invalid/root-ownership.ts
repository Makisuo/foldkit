import { ApplicationComposition as ImportedApplicationComposition } from './rootApplication'

import { Child } from './child'

const RootApplicationComposition = ImportedApplicationComposition

type RootHtmlBuilder = Parameters<
  Parameters<typeof RootApplicationComposition.view>[0]
>[1]

const childViewHelper = (h: RootHtmlBuilder) =>
  h.button([h.OnClick(Child.Message.ClickedFromRootViewHelper())])

export const page = RootApplicationComposition.toApplication({
  routing: {
    onUrlRequest: () => RootApplicationComposition.Message.ClickedOwnLink(),
    onUrlChange: () => Child.Message.ClickedFromRootCompletion(),
  },
})

export const element = RootApplicationComposition.toElement({
  view: (_model, h) =>
    h.div(
      [h.OnClick(Child.Message.ClickedFromElementCompletion())],
      [childViewHelper(h)],
    ),
})
