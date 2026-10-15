import { Runtime } from 'foldkit'

import { ApplicationComposition } from './application'
import { Flags, flags } from './flags'
import { init } from './init'
import { ApplicationLayer, EffectsLayer } from './layer'
import { Message } from './message'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer), { flags })
