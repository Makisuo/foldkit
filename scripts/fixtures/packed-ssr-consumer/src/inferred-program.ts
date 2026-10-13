import { Layer, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import type { Document } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({ Ticked: {} })
const Application = defineApplication({ Model, Message })

const init = () => ({ model: Model.make({ count: 0 }) })
const update = Application.update(model => ({ model }))
const elementView = Application.view((model, h) =>
  h.div([], [String(model.count)]),
)
const applicationView = Application.view((model, h): Document => ({
  title: `Count ${model.count}`,
  body: h.div([], [String(model.count)]),
}))

const implementation = {
  init,
  update,
  EffectsLayer: Layer.empty,
}

export const makeInferredElement = (container: HTMLElement) =>
  Application.makeElement({ ...implementation, view: elementView, container })

export const makeInferredApplication = (container: HTMLElement | null) =>
  Application.make({ ...implementation, view: applicationView, container })
