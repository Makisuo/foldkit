import { Option } from 'effect'
import { ManagedResource, Subscription } from 'foldkit'

import { Message } from './message'
import { type Model } from './model'
import { Playground, Ui } from './page'
import * as Subscriptions from './subscription'

const uiPagesSubscriptions = Subscription.lift(Ui.subscriptions)<
  Model,
  Message
>({
  read: model => Option.some(model.uiPages),
  toParentMessage: message => Message.GotUiPageMessage({ message }),
})

export const subscriptions = Subscription.aggregate(
  Subscriptions.ActiveSection.subscriptions,
  uiPagesSubscriptions,
  Subscriptions.SearchShortcut.subscriptions,
  Subscriptions.SystemTheme.subscriptions,
  Subscriptions.ViewportWidth.subscriptions,
)

export const managedResources = ManagedResource.lift(
  Playground.managedResources,
)<Model, Message>({
  read: model =>
    Option.filter(model.playground, () =>
      Option.contains(model.maybeIsPlaygroundSupported, true),
    ),
  toParentMessage: message => Message.GotPlaygroundMessage({ message }),
})
