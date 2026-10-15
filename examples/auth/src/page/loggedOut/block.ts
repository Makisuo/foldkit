import type { LoggedOutRoute } from '../../route'
import { LoggedOutComposition } from './composition'
import { LoggedOut } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedOutComposition.toBlock({
  init: LoggedOut.init((route: LoggedOutRoute) => ({ model: init(route) })),
  update,
  view,
})
