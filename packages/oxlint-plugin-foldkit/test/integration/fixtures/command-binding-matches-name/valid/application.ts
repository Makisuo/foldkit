import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ value: Schema.String })
const Message = defineMessageUnion({ CompletedFetchUser: {} })
const ApplicationDefinition = defineApplication({ Model, Message })
const Application = ApplicationDefinition.toComposition({})

export const FetchUser = Application.command('FetchUser', {
  messages: [Message.CompletedFetchUser],
})
