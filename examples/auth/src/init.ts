import { Match, Option } from 'effect'
import { Url } from 'foldkit/url'

import { RedirectToDashboard, RedirectToLogin } from './command'
import { LoggedIn, LoggedOut } from './composition'
import { Application } from './definition'
import type { Flags } from './flags'
import { ApplicationRoute, urlToApplicationRoute } from './route'

export const init = Application.init((flags: Flags, url: Url) => {
  const route = urlToApplicationRoute(url)

  return Option.match(flags.maybeSession, {
    onNone: () =>
      Match.value(route).pipe(
        Match.tag('Home', 'Login', 'NotFound', route => ({
          model: LoggedOut.loggedOut.init(route).model,
        })),
        Match.orElse(() => ({
          model: LoggedOut.loggedOut.init(ApplicationRoute.Login()).model,
          commands: [RedirectToLogin()],
        })),
      ),

    onSome: session =>
      Match.value(route).pipe(
        Match.tag('Dashboard', 'Settings', 'NotFound', route => ({
          model: LoggedIn.loggedIn.init(route, session).model,
        })),
        Match.orElse(() => ({
          model: LoggedIn.loggedIn.init(ApplicationRoute.Dashboard(), session)
            .model,
          commands: [RedirectToDashboard()],
        })),
      ),
  })
})
