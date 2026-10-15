import { Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  handleSlow,
  init,
  subscriptions,
  update,
} from './application'
import { Message } from './definition'
import { view } from './view'

const application = ApplicationComposition.toApplication({
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
