// composition.ts
import { Dialog, Menu } from '@foldkit/ui'

import { ApplicationDefinition } from './definition'
import { Message } from './message'

export const DialogBinding = ApplicationDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const MenuBinding = ApplicationDefinition.bindChild(Menu.block, {
  field: 'menu',
  parentMessage: Message.GotMenuMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [DialogBinding, MenuBinding],
})

// update.ts
import { ApplicationComposition } from './composition'

export const update = ApplicationComposition.makeUpdate()

// view.ts
import {
  ApplicationComposition,
  DialogBinding,
  MenuBinding,
} from './composition'

export const view = ApplicationComposition.makeView((model, h) => ({
  title: 'Account',
  body: h.main(
    [],
    [
      h.block(
        DialogBinding.embedView({
          slotId: 'dialog',
          model: model.dialog,
          viewInputs: dialogViewInputs,
        }),
      ),
      h.block(
        MenuBinding.embedView({
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

const application = ApplicationComposition.makeApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application)
