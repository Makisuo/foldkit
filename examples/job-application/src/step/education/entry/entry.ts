import { modifyFields } from 'foldkit/struct'

import { educationEntry, graduationYearListbox, init, update } from './block'
import { view } from './view'

export const block = educationEntry.assemble({
  init: (entryId: Parameters<typeof init>[0]) => {
    const graduationYearInit = graduationYearListbox.init({
      id: `${entryId}-graduation-year`,
    })

    return {
      model: modifyFields(init(entryId), {
        graduationYearListbox: () => graduationYearInit.model,
      }),
      commands: graduationYearInit.commands,
    }
  },
  update,
  view,
})
