import { Block, Message } from 'foldkit'

import { Model } from './schema-boundary-parent-model.js'
import { ChildBlock } from './schema-boundary-public.js'
export const ParentDefinition = Block.makeDefinition('PublicModelParent', {
  Model,
  Message: Message.defineMessageUnion({ RequestedLoad: {} }),
})
export const ChildBinding = ParentDefinition.makeBinding(ChildBlock, {
  field: 'child',
})
export const ParentComposition = ParentDefinition.makeComposition({
  bindings: [ChildBinding],
})
export const update = ParentComposition.makeUpdate(model =>
  ChildBinding.load('Primary')(model),
)
export const ParentBlock = ParentComposition.assembleBlock({
  init: ParentComposition.makeInit(() => ({ model: {} })),
  update,
})
