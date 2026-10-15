import { modifyFields } from 'foldkit/struct'

import { EffectsLayer } from './command'
import { SkillsComposition, entries } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = SkillsComposition.toBlock({
  init: (initialEntryId: string) => {
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
