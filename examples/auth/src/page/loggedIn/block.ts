import type { Session } from '../../domain/session'
import type { LoggedInRoute } from '../../route'
import { LoggedIn } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedIn.toComposition().toBlock({
  init: (route: LoggedInRoute, session: Session) => ({
    model: init(route, session),
  }),
  update,
  view,
})
