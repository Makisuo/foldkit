import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  RegisteredSkillsDefinition,
  entries,
  init,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredSkillsDefinition.toBlock({
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
