import { modifyFields } from 'foldkit/struct'

import {
  RegisteredSkillsEntryDefinition,
  init,
  proficiencyRadioGroup,
  proficiencyRadioGroupId,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredSkillsEntryDefinition.toBlock({
  init: (entryId: Parameters<typeof init>[0]) => {
    const proficiencyInit = proficiencyRadioGroup.init({
      id: proficiencyRadioGroupId(entryId),
    })

    return {
      model: modifyFields(init(entryId), {
        proficiencyRadioGroup: () => proficiencyInit.model,
      }),
      commands: proficiencyInit.commands,
    }
  },
  update,
  view,
})
