import { Runtime } from 'foldkit'

import { Application, init, update, view } from './application'
import { Message } from './message'

const application = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  viewTransition: ({ message }) => message._tag === 'ChangedUrl',
})

Runtime.run(application)
