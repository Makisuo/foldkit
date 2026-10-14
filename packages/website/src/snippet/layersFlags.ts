import { Context, Effect, Layer, Option, Schema } from 'effect'
import { HttpClient, HttpClientRequest, HttpClientResponse } from 'effect/http'
import { Http, Runtime } from 'foldkit'

import { ApplicationDefinition, init, update, view } from './application'

const Session = Schema.Struct({ id: Schema.String })
type Session = typeof Session.Type

type ApiClient = Readonly<{
  restoreSession: Effect.Effect<Session, unknown>
}>

class ApiClientService extends Context.Service<ApiClientService, ApiClient>()(
  'ApiClientService',
) {}

const ApiClientLayer = Layer.effect(
  ApiClientService,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient

    return {
      restoreSession: Effect.gen(function* () {
        const response = yield* client.execute(
          HttpClientRequest.get('/api/session'),
        )
        yield* HttpClientResponse.filterStatusOk(response)
        return yield* Schema.decodeUnknownEffect(Session)(yield* response.json)
      }),
    }
  }),
)

const ApplicationLayer = Layer.provideMerge(ApiClientLayer, Http.layer)

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

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application.provide(ApplicationLayer), { flags })
