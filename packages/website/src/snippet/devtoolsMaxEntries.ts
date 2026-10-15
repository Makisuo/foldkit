import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: {
    maxEntries: 250,
  },
})

Runtime.run(application)
