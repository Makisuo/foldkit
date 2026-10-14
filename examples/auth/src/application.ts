import { Effect, Layer, Match, Option, Schema } from 'effect'
import { KeyValueStore } from 'effect/persistence'
import { Url } from 'foldkit/url'

import { loggedIn, loggedOut } from './childBindings'
import {
  ClearSession,
  LoadExternal,
  LogError,
  NavigateInternal,
  RedirectToDashboard,
  RedirectToHome,
  RedirectToLogin,
  SaveSession,
} from './command'
import { SESSION_STORAGE_KEY } from './constant'
import { Application } from './definition'
import { Session, SessionJsonString } from './domain/session'
import { ApplicationRoute, urlToApplicationRoute } from './route'

export const ApplicationComposition = Application.toComposition({
  children: [loggedOut, loggedIn],
})

export const Flags = Schema.Struct({
  maybeSession: Schema.Option(Session),
})

export const flags = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore

  const sessionJson = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(SESSION_STORAGE_KEY)),
  )

  const decodeSession = Schema.decodeEffect(SessionJsonString)
  const session = yield* decodeSession(sessionJson)

  return Flags.make({ maybeSession: Option.some(session) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSession: Option.none() })),
  ),
)

export type Flags = typeof Flags.Type

export const EffectsLayer = Layer.mergeAll(
  SaveSession.layer,
  ClearSession.layer,
  LogError.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
  RedirectToLogin.layer,
  RedirectToDashboard.layer,
  RedirectToHome.layer,
)

export const init = (flags: Flags, url: Url) => {
  const route = urlToApplicationRoute(url)

  return Option.match(flags.maybeSession, {
    onNone: () =>
      Match.value(route).pipe(
        Match.tag('Home', 'Login', 'NotFound', route => ({
          model: loggedOut.init(route).model,
        })),
        Match.orElse(() => ({
          model: loggedOut.init(ApplicationRoute.Login()).model,
          commands: [RedirectToLogin()],
        })),
      ),

    onSome: session =>
      Match.value(route).pipe(
        Match.tag('Dashboard', 'Settings', 'NotFound', route => ({
          model: loggedIn.init(route, session).model,
        })),
        Match.orElse(() => ({
          model: loggedIn.init(ApplicationRoute.Dashboard(), session).model,
          commands: [RedirectToDashboard()],
        })),
      ),
  })
}
