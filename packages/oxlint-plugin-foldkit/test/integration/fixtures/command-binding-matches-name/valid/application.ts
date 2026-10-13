import { Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ value: Schema.String })
const Message = defineMessageUnion({ CompletedFetchUser: {} })
const Application = defineApplication({ Model, Message })
const RegisteredApplication = Application.register({})

export const FetchUser = RegisteredApplication.command('FetchUser', {
  messages: [Message.CompletedFetchUser],
})
