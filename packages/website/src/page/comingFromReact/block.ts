import { ComingFromReactComposition } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = ComingFromReactComposition.toBlock({
  init,
  update,
  view,
})
