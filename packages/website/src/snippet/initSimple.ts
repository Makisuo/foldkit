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

const ApplicationDefinition = defineApplication({ Model, Message })
const ApplicationComposition = ApplicationDefinition.makeComposition()

const init = ApplicationComposition.makeInit(() => ({
  model: { count: 0 },
}))
