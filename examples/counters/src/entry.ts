import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './application'

const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.run(program)
