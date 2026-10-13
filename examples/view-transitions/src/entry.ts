import { Runtime } from 'foldkit'

import {
  Application,
  Message,
  implementation,
  viewTransition,
} from './application'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  viewTransition,
  devTools: { Message },
})

Runtime.run(application)
