import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import { Tabs } from '@foldkit/ui'

import { ExampleSources } from './sources'

export const Message = defineMessageUnion({
  GotSourceFileTabsMessage: { message: Tabs.Message },
  RequestedLoadInitialSources: {
    maybeInitialSlug: Schema.Option(Schema.String),
    maybeExampleSources: Schema.Option(ExampleSources),
  },
  InformedOfRouteChange: { slug: Schema.String },
  ChangedExampleUrl: { url: Schema.String },
  ToggledLivePreview: { isOpen: Schema.Boolean },
  SucceededLoadExampleSources: { sources: ExampleSources },
  FailedLoadExampleSources: { error: Schema.String },
})
export type Message = typeof Message.Type
