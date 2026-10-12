import { Application } from 'foldkit'

import { Flags, Model, view } from './main'
import { Message } from './message'
import {
  init,
  managedResources,
  mounts,
  subscriptions,
  update,
} from './submodel'

export { managedResources, subscriptions } from './submodel'

export const makeApplication = (container: HTMLElement | null) =>
  Application.make({
    Model,
    Flags,
    init,
    update,
    view,
    subscriptions,
    managedResources,
    mounts,
    container,
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
