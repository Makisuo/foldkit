import { Layer, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'

export const Model = Schema.Struct({ count: Schema.Number })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({})
export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })

export const init = () => ({ model: Model.make({ count: 0 }) })

export const update = Application.update(model => ({ model }))

export const view = Application.view((model, h) => ({
  title: 'Client only',
  body: h.main([], [model.count.toString()]),
}))

export const implementation = {
  init,
  update,
  view,
  EffectsLayer: Layer.empty,
}
