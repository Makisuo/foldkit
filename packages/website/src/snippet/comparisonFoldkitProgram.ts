// src/init.ts

import { Application } from './definition'

export const init = Application.init((flags: Flags) => ({
  model: {
    grid: Option.match(flags.maybeSavedCanvas, {
      onNone: () => createEmptyGrid(DEFAULT_GRID_SIZE),
      onSome: ({ grid }) => grid,
    }),
    undoStack: [],
    redoStack: [],
    tool: 'Brush',
    mirrorMode: 'None',
    isDrawing: false,
    maybeHoveredCell: Option.none(),
    errorDialog: Dialog.init({ id: 'export-error-dialog' }),
    themeListbox: Listbox.init({ id: 'theme-picker' }),
    // remaining fields elided for brevity
  },
}))

// src/entry.ts

import { Runtime } from 'foldkit'

import { ApplicationComposition, update, view, Flags } from './application'
import { flags } from './flags'
import { init } from './init'

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  Flags,
  container: document.getElementById('root'),
})

Runtime.run(application, { flags })
