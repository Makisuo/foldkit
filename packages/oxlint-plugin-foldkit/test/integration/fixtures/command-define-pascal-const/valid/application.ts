import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ value: Schema.String })
const Message = defineMessageUnion({ CompletedFetchUser: {} })
const ApplicationDefinition = defineApplication({ Model, Message })

export const FetchUser = ApplicationDefinition.command('FetchUser', {
  messages: [Message.CompletedFetchUser],
})
