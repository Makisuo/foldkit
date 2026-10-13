import { Layer } from 'effect'

import { LoadPlayground } from './children'
import * as Lifecycle from './lifecycle'
import * as Root from './root'
import * as Subscriptions from './subscription'

export { Application } from './children'
export { Message } from './message'
export {
  Flags,
  ScrollSidebarActiveLinkIntoView,
  ScrollToTop,
  init,
  update,
  view,
} from './root'

export const EffectsLayer = Layer.mergeAll(
  Root.EffectsLayer,
  LoadPlayground.layer,
  Subscriptions.EffectsLayer,
)

export const subscriptions = Lifecycle.subscriptions

export const implementation = {
  init: Root.init,
  update: Root.update,
  view: Root.view,
  subscriptions,
  EffectsLayer,
}
