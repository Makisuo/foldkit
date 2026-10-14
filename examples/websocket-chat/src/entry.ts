import { Socket } from 'effect/socket'
import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { managedResources } from './managedResource'
import { Message } from './message'
import { subscriptions } from './subscription'
import { init, update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  subscriptions,
  managedResources,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(Socket.layerWebSocketConstructorGlobal))
