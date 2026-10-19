import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './block'
import { Flags, flags } from './flags'

const program = Program.make({
  block: ApplicationBlock,
  Flags,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: ApplicationBlock.Message.ClickedLink,
    onUrlChange: ApplicationBlock.Message.ChangedUrl,
  },
  devTools: { Message: ApplicationBlock.Message },
})

Runtime.run(program, { flags })
