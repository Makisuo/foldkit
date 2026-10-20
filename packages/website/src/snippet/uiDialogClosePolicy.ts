import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import {
  EditorComposition,
  EditorDefinition,
  Message,
} from './editor/definition'

const foldDialogOutMessage = EditorDefinition.makeOutMessageFold(
  Dialog.DialogBlock,
  {
    Opened: EditorDefinition.makeNoopStep,
    Closed: () =>
      EditorDefinition.makeFieldsStep(() => ({
        route: () => '/projects',
      })),
    CompletedClose: EditorDefinition.makeNoopStep,
  },
)

export const DialogBinding = EditorDefinition.makeBinding(Dialog.DialogBlock, {
  field: 'dialog',
}).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const update = EditorComposition.makeUpdate((model, message) =>
  Message.match(message, {
    SavedProject: ({ project }) =>
      Update.combineSteps(model, [
        stepModel => ({
          model: modifyFields(stepModel, { project: () => project }),
        }),
        DialogBinding.requestClose(),
      ]),
  }),
)
