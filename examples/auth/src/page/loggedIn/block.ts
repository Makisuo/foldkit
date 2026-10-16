import type { Session } from '../../domain/session'
import type { LoggedInRoute } from '../../route'
import { LoggedInComposition } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedInComposition.toBlock({
  init: LoggedInComposition.init((route: LoggedInRoute, session: Session) => ({
    model: init(route, session),
  })),
  update,
  view,
})
