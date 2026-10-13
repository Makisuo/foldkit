import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as Update from 'foldkit/update'

import * as Dialog from '../../dialog/index.js'

// MODEL

export const Model = Schema.Struct({
  isEnabled: Schema.Boolean,
  dialog: Dialog.Model,
})
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({
  ClickedToggle: {},
  ClickedSubmit: {},
  GotDialogMessage: { message: Dialog.Message },
})
export type Message = typeof Message.Type

const DisabledButtonTest = Block.define('DisabledButtonTest', {
  Model,
  Message,
})

// INIT

export const initialModel: Model = {
  isEnabled: false,
  dialog: Dialog.boot({ id: 'test-dialog' }).model,
}

// UPDATE

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

const registered = DisabledButtonTest.register({ children: [dialog] })

export const update = DisabledButtonTest.update((model, message) =>
  Message.match(message, {
    ClickedToggle: () => ({
      model: modifyFields(model, { isEnabled: isEnabled => !isEnabled }),
    }),
    ClickedSubmit: () => ({ model }),
    GotDialogMessage: ({ message: dialogMessage }) =>
      dialog.fold(model, dialogMessage),
  }),
)

// VIEW

const submitButton = <AllowedMountRequirements>(
  isEnabled: boolean,
  h: HtmlBuilder<Message, AllowedMountRequirements>,
): Html =>
  h.button(
    [
      h.Class('submit'),
      ...(isEnabled
        ? [h.OnClick(Message.ClickedSubmit())]
        : [h.Disabled(true)]),
    ],
    ['Submit'],
  )

/** Plain view, no dialog wrapper. */
export const view = (model: Model, h: HtmlBuilder<Message>): Html => {
  return h.div(
    [],
    [
      h.button([h.OnClick(Message.ClickedToggle())], ['Toggle']),
      submitButton(model.isEnabled, h),
    ],
  )
}

/** View with submit button inside a dialog's panel. */
export const viewWithDialog = registered.view((model, h) => {
  return h.div(
    [],
    [
      h.button([h.OnClick(Message.ClickedToggle())], ['Toggle']),
      h.block(
        dialog.embedView({
          slotId: model.dialog.id,
          model: model.dialog,
          viewInputs: {
            toView: ({ dialog, backdrop, panel, isVisible }) =>
              h.dialog(
                [...dialog],
                isVisible
                  ? [
                      h.div([...backdrop]),
                      h.div([...panel], [submitButton(model.isEnabled, h)]),
                    ]
                  : [],
              ),
          },
        }),
      ),
    ],
  )
})

export const block = registered.assemble({
  init: () => ({ model: initialModel }),
  update,
  view: viewWithDialog,
  EffectsLayer: Layer.empty,
})
