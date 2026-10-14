import { Runtime } from 'foldkit'

import { Application } from './application'
import { Flags, flags } from './flags'
import { init } from './init'
import { EffectsLayer } from './layer'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { subscriptions } from './subscription'
import { update } from './update'
import { view } from './view'

const application = Application.make({
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
