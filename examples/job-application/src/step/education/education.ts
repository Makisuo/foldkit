import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  RegisteredEducationDefinition,
  entries,
  init,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredEducationDefinition.toBlock({
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
