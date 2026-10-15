import { modifyFields } from 'foldkit/struct'

import {
  EducationEntryComposition,
  graduationYearListbox,
  init,
  update,
} from './entry'
import { view } from './view'

export const block = EducationEntryComposition.toBlock({
  init: (entryId: string) => {
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
