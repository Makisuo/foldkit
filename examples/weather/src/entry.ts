import { Http, Runtime } from 'foldkit'

import {
  ApplicationComposition,
  EffectsLayer,
  Message,
  init,
  update,
  view,
} from './application'

export const ApplicationLayer = Http.layer

const application = ApplicationComposition.make({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
