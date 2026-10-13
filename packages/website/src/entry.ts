import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'

import {
  Application,
  Flags,
  Message,
  EffectsLayer,
  init,
  update,
  view,
  subscriptions,
} from './application'
import { ApplicationLayer } from './services'

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
  devTools: {
    show: 'Always',
    mode: { development: 'TimeTravel', production: 'Inspect' },
    banner:
      'Welcome to Foldkit DevTools. This site runs on Foldkit. Select a recorded Message to inspect its payload, Model changes, returned Commands, and Mount activity. Browse earlier states in the timeline. In development, you can pause and resume the view, and AI agents can inspect the history through MCP.',
    Message,
  },
})

Runtime.hydrate(provide(application, ApplicationLayer))
