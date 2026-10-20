// ✅ Bind the completed Block and use its public test Definition.
import { Schema, Tuple } from 'effect'
import { Block, Scene } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { Dialog } from '@foldkit/ui'

const Model = Schema.Struct({ dialog: Dialog.DialogBlock.Model })

const Message = defineMessageUnion({})
const ConfirmDefinition = Block.makeDefinition('Confirm', { Model, Message })
const DialogBinding = ConfirmDefinition.bindChild(Dialog.DialogBlock, {
  field: 'dialog',
  init: { contextToArgs: () => Tuple.make({ id: 'confirm' }) },
}).withOutMessagePolicy({
  fold: ConfirmDefinition.makeOutMessageFold(Dialog.DialogBlock, {
    Opened: ConfirmDefinition.stepNoop,
    Closed: ConfirmDefinition.stepNoop,
    CompletedClose: ConfirmDefinition.stepNoop,
  }),
})
const ConfirmComposition = ConfirmDefinition.makeComposition({
  bindings: [DialogBinding],
})

const init = ConfirmComposition.makeInit(() => ({ model: {} }))
export const dialog: typeof Dialog.DialogBlock.Model.Type = init().model.dialog

Scene.Mount.resolve(
  Dialog.test.AcquireResources,
  Dialog.DialogBlock.Message.SucceededAcquireResources(),
)
