// application.ts
import { defineApplication } from 'foldkit'

import { Dialog, Menu } from '@foldkit/ui'

import { Message } from './message'
import { Model } from './model'

const Application = defineApplication({ Model, Message })

const dialog = Application.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const menu = Application.bindChild(Menu.block, {
  field: 'menu',
  parentMessage: Message.GotMenuMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [dialog, menu],
})

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    GotDialogMessage: ({ message }) => dialog.fold(model, message),
    GotMenuMessage: ({ message }) => menu.fold(model, message),
  }),
)

export const view = ApplicationComposition.view((model, h) => ({
  title: 'Account',
  body: h.main(
    [],
    [
      h.block(
        dialog.embedView({
          slotId: 'dialog',
          model: model.dialog,
          viewInputs: dialogViewInputs,
        }),
      ),
      h.block(
        menu.embedView({
          slotId: 'menu',
          model: model.menu,
          viewInputs: menuViewInputs,
        }),
      ),
    ],
  ),
}))

// entry.ts
import { Runtime } from 'foldkit'

import { ApplicationComposition, update, view } from './application'
import { init } from './init'
import { Message } from './message'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
