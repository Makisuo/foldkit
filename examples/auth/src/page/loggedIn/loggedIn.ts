import { LoggedIn } from './block'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedIn.assemble({
  init: (...args: Parameters<typeof init>) => ({ model: init(...args) }),
  update,
  view,
})
