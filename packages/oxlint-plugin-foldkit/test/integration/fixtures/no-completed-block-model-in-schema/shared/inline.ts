import { Schema } from 'effect'
import * as Framework from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

export const inline = Framework.Block.makeDefinition('Inline', {
  Model: Schema.Struct({ count: Schema.Number }),
  Message: defineMessageUnion({ ClickedIncrement: {} }),
}).makeComposition().assembleBlock({})
