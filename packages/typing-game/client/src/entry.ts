import { Runtime } from 'foldkit'

import { EffectsLayer } from './application'
import { ApplicationComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message, mode: 'TimeTravel' },
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

Runtime.run(application.provide(ApplicationLayer))
