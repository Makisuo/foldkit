import { Application as ImportedApplication } from './rootApplication'

import { Child } from './child'

const RootApplication = ImportedApplication

type RootHtmlBuilder = Parameters<
  Parameters<typeof RootApplication.view>[0]
>[1]

const childViewHelper = (h: RootHtmlBuilder) =>
  h.button([h.OnClick(Child.Message.ClickedFromRootViewHelper())])

export const page = RootApplication.make({
  routing: {
    onUrlRequest: () => RootApplication.Message.ClickedOwnLink(),
    onUrlChange: () => Child.Message.ClickedFromRootCompletion(),
  },
})

export const element = RootApplication.makeElement({
  view: (_model, h) =>
    h.div(
      [h.OnClick(Child.Message.ClickedFromElementCompletion())],
      [childViewHelper(h)],
    ),
})
