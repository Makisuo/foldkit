import { BlockPage } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = BlockPage.toComposition().toBlock({
  init,
  update,
  view,
})
