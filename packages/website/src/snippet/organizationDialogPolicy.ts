import { Dialog } from '@foldkit/ui'

import { SaveDraft } from '../command'
import { EditorDefinition } from '../definition'

const foldDialogOutMessage = EditorDefinition.makeOutMessageFold(
  Dialog.DialogBlock,
  {
    Opened: () => EditorDefinition.stepNoop(),
    CompletedClose: () => EditorDefinition.stepNoop(),
    Closed: () =>
      EditorDefinition.step(model => ({
        model,
        commands: [SaveDraft({ contents: model.contents })],
      })),
  },
)

export const DialogBinding = EditorDefinition.bindChild(Dialog.DialogBlock, {
  field: 'dialog',
  outMessage: { fold: foldDialogOutMessage },
})
