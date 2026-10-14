import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ value: Schema.String })
const Message = defineMessageUnion({ CompletedFetchUser: {} })
const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition({})

export const SaveUser = ApplicationComposition.command('FetchUser', {
  messages: [Message.CompletedFetchUser],
})
