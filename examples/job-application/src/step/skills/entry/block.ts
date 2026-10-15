import { modifyFields } from 'foldkit/struct'

import { SkillsEntryComposition, proficiencyRadioGroup } from './composition'
import { SkillsEntry } from './definition'
import { init, proficiencyRadioGroupId } from './init'
import { update } from './update'
import { view } from './view'

export const block = SkillsEntryComposition.toBlock({
  init: SkillsEntry.init((entryId: string) => {
    const proficiencyInit = proficiencyRadioGroup.init({
      id: proficiencyRadioGroupId(entryId),
    })

    return {
      model: modifyFields(init(entryId), {
        proficiencyRadioGroup: () => proficiencyInit.model,
      }),
      commands: proficiencyInit.commands,
    }
  }),
  update,
  view,
})
