// composition.ts
import { Dialog, Menu } from '@foldkit/ui'

import { Application } from './definition'
import { Message } from './message'

export const dialog = Application.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const menu = Application.bindChild(Menu.block, {
  field: 'menu',
  parentMessage: Message.GotMenuMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [dialog, menu],
})

// update.ts
import { dialog, menu } from './composition'
import { Application } from './definition'
import { Message } from './message'

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotDialogMessage: ({ message }) => dialog.fold(model, message),
    GotMenuMessage: ({ message }) => menu.fold(model, message),
  }),
)

// view.ts
import { ApplicationComposition, dialog, menu } from './composition'

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

import { ApplicationComposition } from './composition'
import { init } from './init'
import { Message } from './message'
import { update } from './update'
import { view } from './view'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
