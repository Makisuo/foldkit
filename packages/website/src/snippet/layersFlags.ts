import { Effect, Option, Schema } from 'effect'
import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'
import { ApiClientService, ApplicationLayer, Session } from './services'

const Flags = Schema.Struct({
  maybeSession: Schema.Option(Session),
})
type Flags = typeof Flags.Type

const flags = Effect.gen(function* () {
  const apiClient = yield* ApiClientService
  const session = yield* apiClient.restoreSession
  return Flags.make({ maybeSession: Option.some(session) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSession: Option.none() })),
  ),
)

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer), { flags })
