// composition.ts
import { Dialog, Menu } from '@foldkit/ui'

import { ApplicationDefinition } from './definition'

export const DialogBinding = ApplicationDefinition.bindChild(
  Dialog.DialogBlock,
  {
    field: 'dialog',
  },
).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const ApplicationMenu = Menu.create<string>()

export const MenuBinding = ApplicationDefinition.bindChild(ApplicationMenu, {
  field: 'menu',
}).withOutMessagePolicy({ fold: foldMenuOutMessage })

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [DialogBinding, MenuBinding],
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

// block.ts
import { ApplicationComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
})

// entry.ts
import { Program, Runtime } from 'foldkit'

import { ApplicationBlock } from './block'

const program = Program.make({
  block: ApplicationBlock,
  container: document.getElementById('root'),
  devTools: { dispatch: true },
})

Runtime.run(program)
