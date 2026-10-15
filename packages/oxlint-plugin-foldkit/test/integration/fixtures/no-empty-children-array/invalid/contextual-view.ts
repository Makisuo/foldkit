import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({})
const Message = defineMessageUnion({ Rendered: {} })
const ContextualView = Block.define('ContextualView')
const feature = ContextualView.define({ Model, Message })

const ContextualViewComposition = feature.toComposition()

export const view = ContextualViewComposition.view((_model, h) =>
  h.div([], []),
)
