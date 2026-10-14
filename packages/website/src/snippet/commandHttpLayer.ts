import { Http, Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  FetchCountLayer,
  Message,
  update,
} from './counterHttpCommand'
import { init, view } from './counterHttpCompletion'

export const ApplicationLayer = Http.layer

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer: FetchCountLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
