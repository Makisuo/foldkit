import { modifyFields } from 'foldkit/struct'

import {
  RegisteredEducationEntryDefinition,
  graduationYearListbox,
  init,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredEducationEntryDefinition.toBlock({
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
