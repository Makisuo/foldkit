import { Runtime } from 'foldkit'

import { Application, implementation, Message } from './application'
import './styles.css'

const application = Application.make({
  ...implementation,
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(application)
