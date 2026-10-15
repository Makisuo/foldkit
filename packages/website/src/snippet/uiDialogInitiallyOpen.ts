import { DialogExample } from './definition'

const init = DialogExample.init(() => {
  const dialogInit = dialog.init({ id: 'confirm' })
  const initialModel = Model.make({ dialog: dialogInit.model })
  const dialogOpen = dialog.open()(initialModel)

  return {
    model: dialogOpen.model,
    commands: [...(dialogInit.commands ?? []), ...(dialogOpen.commands ?? [])],
  }
})
