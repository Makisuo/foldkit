import { modifyFields } from 'foldkit/struct'

import { EffectsLayer } from './command'
import { SkillsComposition, entries } from './composition'
import { Skills } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = SkillsComposition.toBlock({
  init: Skills.init((initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId)

    return {
      model: modifyFields(init(initialEntryId), {
        entries: () => [entryInit.model],
      }),
      commands: entryInit.commands,
    }
  }),
  update,
  view,
  EffectsLayer,
})
