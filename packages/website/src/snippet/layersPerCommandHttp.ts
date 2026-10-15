import { Http, Runtime } from 'foldkit'

import {
  ApplicationComposition,
  FetchCountLayer,
  Message,
  update,
} from './counterHttpCommand'
import { init, view } from './counterHttpCompletion'

export const ApplicationLayer = Http.layer

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer: FetchCountLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
