import { Runtime } from 'foldkit'

import { Application, EffectsLayer, Flags, flags, init } from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { update } from './update'
import { view } from './view'

const application = Application.make({
  init,
  update,
  view,
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
