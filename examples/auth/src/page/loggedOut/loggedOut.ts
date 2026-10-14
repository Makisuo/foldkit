import { RegisteredLoggedOutDefinition } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = RegisteredLoggedOutDefinition.toBlock({
  init: (route: Parameters<typeof init>[0]) => ({ model: init(route) }),
  update,
  view,
})
