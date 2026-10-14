import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  Message,
  handleSlow,
  init,
  subscriptions,
  update,
  view,
} from './application'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  subscriptions,
  EffectsLayer,
  container: document.getElementById('root'),
  slow: {
    show: 'Always',
    onSlow: handleSlow,
  },
  devTools: { Message },
})

Runtime.run(application)
