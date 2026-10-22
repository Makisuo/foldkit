import { Schema } from 'effect'
import * as Framework from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Composition = Framework.Block.makeDefinition('Inline', {
  Model: Schema.Struct({ count: Schema.Number }),
  Message: defineMessageUnion({ ClickedIncrement: {} }),
}).makeComposition()
const assemble = () => Composition.assembleBlock({})
export const inline = Framework.Block.complete(assemble)
