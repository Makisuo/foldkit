import { Runtime } from 'foldkit'

import {
  Application,
  Flags,
  Message,
  flags,
  implementation,
} from './application'

const application = Application.make({
  ...implementation,
  Flags,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.run(application, { flags })
