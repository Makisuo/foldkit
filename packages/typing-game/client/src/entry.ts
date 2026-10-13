import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import {
  Application,
  EffectsLayer,
  Message,
  init,
  update,
  view,
} from './application'
import { ApplicationLayer } from './services'

const application = Application.make({
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

Runtime.run(provide(application, ApplicationLayer))
