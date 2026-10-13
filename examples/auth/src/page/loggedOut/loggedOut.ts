import { loggedOut } from './block'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = loggedOut.assemble({
  init: (route: Parameters<typeof init>[0]) => ({ model: init(route) }),
  update,
  view,
})
