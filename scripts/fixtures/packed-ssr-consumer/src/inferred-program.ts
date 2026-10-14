import { Layer, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import type { Document } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({ Ticked: {} })
const ApplicationDefinition = defineApplication({ Model, Message })

const ApplicationComposition = ApplicationDefinition.toComposition()

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
  ApplicationComposition.makeElement({
    init,
    update,
    EffectsLayer,
    view: elementView,
    container,
  })

export const makeInferredApplication = (container: HTMLElement | null) =>
  ApplicationComposition.make({
    init,
    update,
    EffectsLayer,
    view: applicationView,
    container,
  })
