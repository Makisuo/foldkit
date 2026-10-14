import { Runtime } from 'foldkit'

import { ApplicationDefinition, init, update, view } from './application'
import { Message } from './message'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

Runtime.run(application)
