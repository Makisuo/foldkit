import type { Session } from '../../domain/session'
import type { LoggedInRoute } from '../../route'
import { LoggedIn, LoggedInComposition } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedInComposition.toBlock({
  init: LoggedIn.init((route: LoggedInRoute, session: Session) => ({
    model: init(route, session),
  })),
  update,
  view,
})
