import { modifyFields } from 'foldkit/struct'

import { EducationEntryComposition, graduationYearListbox } from './composition'
import { init } from './init'
import { update } from './update'
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
