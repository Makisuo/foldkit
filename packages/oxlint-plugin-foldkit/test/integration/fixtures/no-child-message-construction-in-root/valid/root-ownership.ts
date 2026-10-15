import { Application as ImportedApplication, Message } from './rootApplication'

const RootApplication = ImportedApplication

type RootHtmlBuilder = Parameters<
  Parameters<typeof RootApplication.view>[0]
>[1]

const rootViewHelper = (h: RootHtmlBuilder) =>
  h.button([h.OnClick(Message.ClickedContinue())])

export const page = RootApplication.toApplication({
  routing: {
    onUrlRequest: request =>
      RootApplication.Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

export const element = RootApplication.toElement({
  view: (_model, h) =>
    h.div(
      [h.OnClick(RootApplication.Message.ClickedElement())],
      [rootViewHelper(h)],
    ),
})
