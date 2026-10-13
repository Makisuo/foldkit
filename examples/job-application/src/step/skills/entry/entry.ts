import { modifyFields } from 'foldkit/struct'

import {
  init,
  proficiencyRadioGroup,
  proficiencyRadioGroupId,
  skillsEntry,
  update,
} from './block'
import { view } from './view'

export const block = skillsEntry.assemble({
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
