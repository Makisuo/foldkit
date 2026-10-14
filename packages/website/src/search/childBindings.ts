import { Update } from 'foldkit'

import { Dialog } from '@foldkit/ui'

import { Search } from './definition'
import { Message } from './message'
import { Model } from './model'

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const dialog = Search.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotSearchDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const SearchComposition = Search.toComposition({
  children: [dialog],
})
