import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({
  count: Schema.Number,
})
type Model = typeof Model.Type

const Message = defineMessageUnion({
  ClickedIncrement: {},
  ClickedDecrement: {},
})
type Message = typeof Message.Type

const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition()

const init = ApplicationComposition.init(() => ({
  model: { count: 0 },
}))
