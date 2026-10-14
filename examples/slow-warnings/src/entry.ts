import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Message,
  handleSlow,
  init,
  subscriptions,
  update,
  view,
} from './application'

const application = ApplicationDefinition.make({
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
