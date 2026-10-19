import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import {
  EditorComposition,
  EditorDefinition,
  Message,
  Model,
} from './editor/definition'

const foldDialogOutMessage = Dialog.DialogBlock.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => EditorDefinition.stepNoop(),
  Closed: () =>
    EditorDefinition.stepFields(() => ({
      route: () => '/projects',
    })),
  CompletedClose: () => EditorDefinition.stepNoop(),
})

export const DialogBinding = EditorDefinition.bindChild(Dialog.DialogBlock, {
  field: 'dialog',
  outMessage: { fold: foldDialogOutMessage },
})

export const update = EditorComposition.makeUpdate((model, message) =>
  Message.match(message, {
    SavedProject: ({ project }) =>
      Update.combine(model, [
        stepModel => ({
          model: modifyFields(stepModel, { project: () => project }),
        }),
        DialogBinding.requestClose(),
      ]),
  }),
)
