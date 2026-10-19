import { Program, Runtime } from 'foldkit'

import { ApplicationBlock, Flags } from './application'

const program = Program.make({
  block: ApplicationBlock,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.hydrate(program)
