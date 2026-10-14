import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { Message } from './message'
import { init, update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.run(application)
