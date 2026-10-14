import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

const Model = Schema.Struct({
  count: Schema.Number,
})
type Model = typeof Model.Type

const Message = defineMessageUnion({
  ClickedIncrement: {},
})
type Message = typeof Message.Type

const ApplicationDefinition = defineApplication({ Model, Message })

const ApplicationComposition = ApplicationDefinition.toComposition()

const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  }),
)

const view = ApplicationComposition.view((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.div(
    [],
    [
      h.p([], [`Count: ${model.count}`]),
      h.button([h.OnClick(Message.ClickedIncrement())], ['Increment']),
    ],
  ),
}))
