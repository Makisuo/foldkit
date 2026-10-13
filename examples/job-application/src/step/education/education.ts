import { modifyFields } from 'foldkit/struct'

import { EffectsLayer, education, entries, init, update } from './block'
import { view } from './view'

export const block = education.assemble({
  init: (today: Parameters<typeof init>[0], initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId)

    return {
      model: modifyFields(init(today, initialEntryId), {
        entries: () => [entryInit.model],
      }),
      commands: entryInit.commands,
    }
  },
  update,
  view,
  EffectsLayer,
})
