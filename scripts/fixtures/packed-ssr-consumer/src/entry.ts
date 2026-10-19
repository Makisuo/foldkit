import { Program, Runtime } from 'foldkit'

import { ApplicationBlock, Flags, Message } from './application'

const program = Program.make({
  block: ApplicationBlock,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(program)
