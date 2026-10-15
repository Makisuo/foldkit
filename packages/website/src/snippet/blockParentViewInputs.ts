// view.ts (parent)

import { ApplicationComposition, commandMenu } from './composition'

const MENU_ITEMS: ReadonlyArray<string> = ['Open', 'Rename', 'Archive']

export const view = ApplicationComposition.view((model, h) => ({
  title: 'My App',
  body: h.div(
    [],
    [
      h.block(
        commandMenu.embedView({
          slotId: 'command-menu',
          model: model.commandMenu,
          viewInputs: {
            buttonLabel: h.span([], ['Actions']),
            items: MENU_ITEMS,
          },
        }),
      ),
    ],
  ),
}))
