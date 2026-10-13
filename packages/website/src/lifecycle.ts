import { Subscription } from 'foldkit'

import * as Subscriptions from './subscription'

export const subscriptions = Subscription.aggregate(
  Subscriptions.ActiveSection.subscriptions,
  Subscriptions.SearchShortcut.subscriptions,
  Subscriptions.SystemTheme.subscriptions,
  Subscriptions.ViewportWidth.subscriptions,
)
