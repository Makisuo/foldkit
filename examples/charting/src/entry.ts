import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './block'
import { registerEcharts } from './echarts'
import { ApplicationLayer } from './services'

registerEcharts()

const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.run(program.provide(ApplicationLayer))
