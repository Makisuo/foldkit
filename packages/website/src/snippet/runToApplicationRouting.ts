import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'
import { Message } from './message'

const application = ApplicationComposition.toApplication({
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
