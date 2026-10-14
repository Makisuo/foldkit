import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer, init } from './application'
import { Message } from './message'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})
Runtime.run(application)
