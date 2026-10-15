import { Runtime } from 'foldkit'

import { EffectsLayer } from './application'
import { ApplicationComposition } from './application'
import { registerEcharts } from './echarts'
import { init } from './init'
import { Message } from './message'
import { ApplicationLayer } from './services'
import { update } from './update'
import { view } from './view'

registerEcharts()

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
