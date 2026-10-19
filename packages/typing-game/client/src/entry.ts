import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './block'
import { ApplicationLayer } from './services'

const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { Message: ApplicationBlock.Message, mode: 'TimeTravel' },
  routing: {
    onUrlRequest: ApplicationBlock.Message.ClickedLink,
    onUrlChange: ApplicationBlock.Message.ChangedUrl,
  },
})

Runtime.run(program.provide(ApplicationLayer))
