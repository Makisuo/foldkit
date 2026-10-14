import { Layer } from 'effect'
import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { subscriptions } from './lifecycle'
import { Message } from './message'
import { Flags, init, update } from './root'
import { PagefindLayer } from './search'
import { LocalStorageLayer, SessionStorageLayer } from './storage'
import { view } from './view/application'

const ApplicationLayer = Layer.mergeAll(
  LocalStorageLayer,
  SessionStorageLayer,
  PagefindLayer,
)

const application = ApplicationComposition.make({
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

Runtime.hydrate(application.provide(ApplicationLayer))
