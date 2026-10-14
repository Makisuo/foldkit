// Pseudocode walkthrough of the Foldkit integration points. Each labeled
// block below is an excerpt. Fit them into your own Model, init, Message,
// update, and view definitions.
import { Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { Dialog } from '@foldkit/ui'
import type { RenderInfo as DialogRenderInfo } from '@foldkit/ui/dialog'

// Add a field to your Model for the Dialog Block:
const Model = Schema.Struct({
  dialog: Dialog.Model,
  // ...your other fields
})
type Model = typeof Model.Type

// In your init function, initialize the Dialog Block with a unique id:
const init = () => {
  const dialogInit = dialog.init({ id: 'confirm' })

  return {
    model: {
      dialog: dialogInit.model,
      // ...your other fields
    },
    commands: dialogInit.commands,
  }
}

// A fact for the trigger, plus the Dialog Message embedded in your parent
// Message for the block delegation:
const Message = defineMessageUnion({
  ClickedOpenDialog: {},
  GotDialogMessage: { message: Dialog.Message },
})
type Message = typeof Message.Type

// One boundary handles Dialog Messages, Commands, and OutMessages. Replace
// either no-op arm with the parent transition that should follow that event.
const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const dialog = Dialog.block.connection({
  Model,
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const DialogExampleDefinition = Block.define('DialogExample', {
  Model,
  Message,
})
const RegisteredDialogExampleDefinition = DialogExampleDefinition.register({
  children: [dialog],
})

const update = DialogExampleDefinition.update((model, message) =>
  Message.match(message, {
    ClickedOpenDialog: () => dialog.open()(model),
    GotDialogMessage: ({ message }) => dialog.fold(model, message),
  }),
)

// In your view, open from a trigger with the fact, and dismiss from a Cancel
// button by spreading the `closeButton` bundle, no parent message needed:
const view = RegisteredDialogExampleDefinition.view((model, h) => {
  const dialogView = ({
    dialog,
    backdrop,
    panel,
    title,
    description,
    closeButton,
    isVisible,
  }: DialogRenderInfo) =>
    h.dialog(
      [...dialog],
      isVisible
        ? [
            h.div([...backdrop, h.Class('fixed inset-0 bg-black/50')]),
            h.div(
              [...panel, h.Class('rounded-lg p-6 max-w-md mx-auto shadow-xl')],
              [
                h.h2([...title], ['Confirm Action']),
                h.p([...description], ['Are you sure you want to proceed?']),
                h.button(
                  [...closeButton, h.Class('px-4 py-2 rounded-lg border')],
                  ['Cancel'],
                ),
              ],
            ),
          ]
        : [],
    )

  return h.div(
    [],
    [
      h.button([h.OnClick(Message.ClickedOpenDialog())], ['Open Dialog']),
      h.block(
        dialog.embedView({
          slotId: model.dialog.id,
          model: model.dialog,
          viewInputs: {
            hasDescription: true,
            toView: dialogView,
          },
        }),
      ),
    ],
  )
})
