import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({})
const Message = defineMessageUnion({ Rendered: {} })
const ContextualViewDefinition = Block.define('ContextualView')
const feature = ContextualViewDefinition.define({ Model, Message })

export const view = feature.view((_model, h) =>
  h.div([], []),
)
