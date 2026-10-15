import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer, init } from './application'
import { Flags, flags } from './flags'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
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

Runtime.run(application, { flags })
