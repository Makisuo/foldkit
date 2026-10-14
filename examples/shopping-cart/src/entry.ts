import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  Message,
  init,
  update,
  view,
} from './application'

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
