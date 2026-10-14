import { Runtime } from 'foldkit'

import { ApplicationComposition, EffectsLayer } from './application'
import { MapRegistryLayer } from './mapRegistry'
import { Message } from './message'
import { init, update } from './update'
import { view } from './view'

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(MapRegistryLayer))
