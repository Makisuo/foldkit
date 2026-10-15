import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'

import { Counter } from './island'
import { ApplicationRoute } from './route'

export const Model = Schema.Struct({
  route: ApplicationRoute,
  counter: Counter.Model,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  GotCounterMessage: { message: Counter.Message },
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })
