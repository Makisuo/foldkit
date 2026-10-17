import { Dialog } from '@foldkit/ui'

import { SaveDraft } from '../command'
import { EditorDefinition } from '../definition'
import { Message } from '../message'

const foldDialogOutMessage = Dialog.OutMessage.match({
  Opened: () => EditorDefinition.step(model => ({ model })),
  CompletedClose: () => EditorDefinition.step(model => ({ model })),
  Closed: () =>
    EditorDefinition.step(model => ({
      model,
      commands: [SaveDraft({ contents: model.contents })],
    })),
})

export const DialogBinding = EditorDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})
