import { Layer } from 'effect'
import type { Block } from 'foldkit'

import {
  SendMessage,
  TimestampReceivedMessage,
  TimestampSentMessage,
} from './command'
import { Application } from './definition'
import { managedResources } from './managedResource'
import { subscriptions } from './subscription'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const EffectsLayer = Layer.mergeAll(
  TimestampSentMessage.layer,
  TimestampReceivedMessage.layer,
  SendMessage.layer,
  managedResources.chatSocket.layer,
  subscriptions.chatSocketMessages.layer,
)
