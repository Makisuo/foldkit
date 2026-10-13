import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

// MODEL - Your entire application state

const Model = Schema.Struct({
  count: Schema.Number,
})
type Model = typeof Model.Type

// MESSAGE - Events that can happen in your app

const Message = defineMessageUnion({
  ClickedIncrement: {},
})
type Message = typeof Message.Type

const Application = defineApplication({ Model, Message })

// UPDATE - How Messages change the Model

const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
  }),
)

// VIEW - A pure function from Model to a Document

const view = Application.view((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.div(
    [],
    [
      h.p([], [`Count: ${model.count}`]),
      h.button([h.OnClick(Message.ClickedIncrement())], ['Increment']),
    ],
  ),
}))
