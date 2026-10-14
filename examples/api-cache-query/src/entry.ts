import { Runtime } from 'foldkit'

import {
  Application,
  EffectsLayer,
  Message,
  init,
  subscriptions,
  update,
  view,
} from './application'

const application = Application.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
