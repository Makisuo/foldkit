import { modifyFields } from 'foldkit/struct'

import { EffectsLayer, entries, init, skills, update } from './block'
import { view } from './view'

export const block = skills.assemble({
  init: (initialEntryId: Parameters<typeof init>[0]) => {
    const entryInit = entries.init(initialEntryId, initialEntryId)

    return {
      model: modifyFields(init(initialEntryId), {
        entries: () => [entryInit.model],
      }),
      commands: entryInit.commands,
    }
  },
  update,
  view,
  EffectsLayer,
})
