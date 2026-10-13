import { Runtime } from 'foldkit'

import { Application, implementation, Message } from './application'
import './styles.css'

const application = Application.make({
  ...implementation,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.hydrate(application)
