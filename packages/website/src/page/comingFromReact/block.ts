import { ComingFromReact } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = ComingFromReact.toComposition().toBlock({
  init,
  update,
  view,
})
