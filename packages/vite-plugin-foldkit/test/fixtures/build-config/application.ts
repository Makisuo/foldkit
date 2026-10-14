import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ count: Schema.Number })
export type Model = typeof Model.Type

export const Flags = Schema.Struct({ start: Schema.Number })
export type Flags = typeof Flags.Type

export const Message = defineMessageUnion({
  ClickedIncrement: {},
})
export type Message = typeof Message.Type

export const ApplicationDefinition = defineApplication({ Model, Message })

export const init = (flags: Flags) => ({
  model: Model.make({ count: flags.start }),
})

export const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  }),
)

export const view = ApplicationDefinition.view((model, h) => ({
  title: `Count ${model.count}`,
  body: h.main([h.Id('counter')], [model.count.toString()]),
}))
