import { Program, Runtime } from 'foldkit'

import { ApplicationBlock, Flags } from './application'
import './styles.css'

const program = Program.make({
  block: ApplicationBlock,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.hydrate(program)
