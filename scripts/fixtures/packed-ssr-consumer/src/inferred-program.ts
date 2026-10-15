import { Layer, Schema } from 'effect'
import { defineApplication } from 'foldkit'
import type { Document } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({ Ticked: {} })
const Application = defineApplication({ Model, Message })

const ApplicationComposition = Application.toComposition()

const init = () => ({ model: Model.make({ count: 0 }) })
const update = ApplicationComposition.update(model => ({ model }))
const elementView = ApplicationComposition.view((model, h) =>
  h.div([], [String(model.count)]),
)
const applicationView = ApplicationComposition.view((model, h): Document => ({
  title: `Count ${model.count}`,
  body: h.div([], [String(model.count)]),
}))

const EffectsLayer = Layer.empty

export const makeInferredElement = (container: HTMLElement) =>
  ApplicationComposition.toElement({
    init,
    update,
    EffectsLayer,
    view: elementView,
    container,
  })

export const makeInferredApplication = (container: HTMLElement | null) =>
  ApplicationComposition.toApplication({
    init,
    update,
    EffectsLayer,
    view: applicationView,
    container,
  })
