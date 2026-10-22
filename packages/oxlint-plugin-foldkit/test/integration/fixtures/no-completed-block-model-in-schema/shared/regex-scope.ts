import { Schema } from 'effect'
import { Block } from 'foldkit'

const Child = { Model: Schema.String }
export { Child }
export const closingBrace = /}/

export const unrelated = (Block: {
  makeDefinition: () => {
    makeComposition: () => {
      assembleBlock: () => unknown
    }
  }
}) => {
  const Child = Block.makeDefinition().makeComposition().assembleBlock();
  return Child
}
