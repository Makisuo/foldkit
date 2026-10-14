import { BlockPageDefinition } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = BlockPageDefinition.toComposition().toBlock({
  init,
  update,
  view,
})
