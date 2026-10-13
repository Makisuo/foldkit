import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({})
const Message = defineMessageUnion({ Rendered: {} })
const ContextualView = Block.define('ContextualView')
const feature = ContextualView.define({ Model, Message })

export const view = feature.view((_model, h) =>
  h.div([], []),
)
