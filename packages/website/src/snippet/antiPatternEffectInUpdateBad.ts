// ❌ Bad: update performs a DOM effect during the state transition.

import { modifyFields } from 'foldkit/struct'

const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    ClickedOpenDialog: () => {
      document.querySelector<HTMLInputElement>('#search-input')?.focus()

      return { model: modifyFields(model, { dialogState: () => 'Open' }) }
    },
  }),
)
