import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  init,
  update,
  view,
  viewTransition,
} from './application'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  viewTransition,
  devTools: { Message },
})

Runtime.run(application)
