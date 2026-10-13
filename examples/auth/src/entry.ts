import { Runtime } from 'foldkit'

import { Application, Flags, flags, implementation } from './application'
import { Message } from './message'
import { ApplicationLayer } from './services'

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

Runtime.run(application.provide(ApplicationLayer), { flags })
