// Pseudocode walkthrough using the same Model, Messages, and update as
// the basic menu; only init and view change. Each labeled block below is
// an excerpt.
import { defineMessageUnion } from 'foldkit/message'

import { Menu } from '@foldkit/ui'

// Only init and view differ from the basic menu: init adds isAnimated, the
// view uses data-[closed] selectors for enter/leave transitions.

// In your init function, set isAnimated: true to coordinate CSS transitions:
const init = () => {
  const menuInit = menu.init({ id: 'actions', isAnimated: true })

  return {
    model: {
      menu: menuInit.model,
      // ...your other fields
    },
    commands: menuInit.commands,
  }
}

// Embed the Menu Message in your parent Message:
// Pair view and update behind a single Item-typed factory at module scope:
const ActionMenu = Menu.create<Action>()

const Message = defineMessageUnion({
  GotMenuMessage: { message: ActionMenu.Message },
})
type Message = typeof Message.Type

// `definition` and the child binding below come from the basic walkthrough.
// Inside your view function, use data-[closed] for enter/leave transitions:
const view = registered.view((model, h) =>
  h.block(
    menu.embedView({
      slotId: 'menu',
      model: model.menu,
      viewInputs: {
        items: actions,
        buttonContent: h.span([], ['Options']),
        buttonClassName: 'rounded-lg border px-3 py-2 cursor-pointer',
        itemsClassName:
          'rounded-lg border shadow-lg transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:scale-95',
        itemToConfig: (action, { isActive }) => ({
          className: isActive ? 'bg-blue-100' : '',
          content: h.div([h.Class('px-3 py-2')], [action]),
        }),
        backdropClassName: 'fixed inset-0',
        anchor: { placement: 'bottom-start', gap: 4, padding: 8 },
      },
    }),
  ),
)
