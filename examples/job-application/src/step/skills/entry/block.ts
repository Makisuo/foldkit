import { modifyFields } from 'foldkit/struct'

import {
  SkillsEntryComposition,
  init,
  proficiencyRadioGroup,
  proficiencyRadioGroupId,
  update,
} from './entry'
import { view } from './view'

export const block = SkillsEntryComposition.toBlock({
  init: (entryId: string) => {
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
