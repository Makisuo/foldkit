import { Update } from 'foldkit'

import { Dialog } from '@foldkit/ui'

import { Message } from './message'
import { Model } from './model'

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const dialog = Dialog.block.connection({
  Model,
  field: 'dialog',
  parentMessage: Message.GotSearchDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})
