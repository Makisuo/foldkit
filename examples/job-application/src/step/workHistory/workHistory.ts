import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  RegisteredWorkHistoryDefinition,
  entries,
  init,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredWorkHistoryDefinition.toBlock({
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
