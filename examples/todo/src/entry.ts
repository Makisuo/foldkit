import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './block'
import { Flags, flags } from './flags'
import { ApplicationLayer } from './services'

const program = Program.make({
  block: ApplicationBlock,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.run(program.provide(ApplicationLayer), {
  flags,
})
