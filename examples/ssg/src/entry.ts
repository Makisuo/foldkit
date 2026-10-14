import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  init,
  update,
  view,
} from './application'
import './styles.css'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

Runtime.hydrate(application)
