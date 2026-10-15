import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  init,
  update,
} from './application'
import { Message } from './definition'
import { view } from './view'

const application = ApplicationComposition.toApplication({
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
