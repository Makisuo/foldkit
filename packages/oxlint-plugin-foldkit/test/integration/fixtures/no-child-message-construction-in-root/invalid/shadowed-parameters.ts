import { Application } from './rootApplication'

type Parameters<Value> = Value

type PretendRootHtmlBuilder = Parameters<
  Parameters<typeof Application.view>[0]
>[1]

export const pretendRootView = (h: PretendRootHtmlBuilder) =>
  h.button([
    h.OnClick(Application.Message.ClickedFromShadowedParameters()),
  ])
