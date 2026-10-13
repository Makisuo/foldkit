// application.ts
import { define as defineApplication } from 'foldkit/application'

import { Dialog, Menu } from '@foldkit/ui'

import { init } from './init'
import { Message } from './message'
import { Model } from './model'

const dialog = Dialog.block.connection({
  Model,
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const menu = Menu.block.connection({
  Model,
  field: 'menu',
  parentMessage: Message.GotMenuMessage,
  outMessage: { fold: foldMenuOutMessage },
})

const Application = defineApplication({ Model, Message })
const registered = Application.register({ children: [dialog, menu] })

const update = Application.update((model, message) =>
  Message.match(message, {
    GotDialogMessage: ({ message }) => dialog.fold(model, message),
    GotMenuMessage: ({ message }) => menu.fold(model, message),
  }),
)

const view = registered.view((model, h) => ({
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

export const makeApplication = (container: HTMLElement | null) =>
  registered.make({
    init,
    update,
    view,
    container,
    devTools: { Message },
  })

// entry.ts
import { Runtime } from 'foldkit'

import { makeApplication } from './application'

const application = makeApplication(document.getElementById('root'))

Runtime.run(application)
