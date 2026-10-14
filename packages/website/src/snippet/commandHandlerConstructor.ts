import { HttpClient } from 'effect/http'
import { define as defineApplication } from 'foldkit/application'

import { Model, Message, fetchCount } from './counterHttpCommand'

const ApplicationDefinition = defineApplication({ Model, Message })

export const FetchCount = ApplicationDefinition.command('FetchCount', {
  messages: [Message.SucceededFetchCount, Message.FailedFetchCount],
  handler: function* () {
    const client = yield* HttpClient.HttpClient

    return () => fetchCount(client)
  },
})

export const EffectsLayer = FetchCount.layer
