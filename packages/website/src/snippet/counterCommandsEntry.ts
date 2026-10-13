import { Runtime } from 'foldkit'

import { Application, init, update, view, EffectsLayer } from './application'

const application = Application.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
})

Runtime.run(application)
