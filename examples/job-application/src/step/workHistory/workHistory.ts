import { modifyFields } from 'foldkit/struct'

import { EffectsLayer, entries, init, update, workHistory } from './block'
import { view } from './view'

export const block = workHistory.assemble({
  init: (today: Parameters<typeof init>[0], initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId, today)

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
