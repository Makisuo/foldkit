import { Http, Runtime } from 'foldkit'

import { ApplicationComposition, init, update } from './application'
import { EffectsLayer } from './command'
import { Message } from './definition'
import { view } from './view'

export const ApplicationLayer = Http.layer

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
