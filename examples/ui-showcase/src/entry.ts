import { Runtime } from 'foldkit'

import {
  Application,
  EffectsLayer,
  Flags,
  Message,
  flags,
  init,
  update,
  view,
} from './application'

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

Runtime.run(application, { flags })
