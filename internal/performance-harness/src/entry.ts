import { Runtime } from 'foldkit'

import {
  Application,
  EffectsLayer,
  Message,
  init,
  update,
  view,
} from './application'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
