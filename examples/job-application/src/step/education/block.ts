import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import {
  EducationComposition,
  EffectsLayer,
  entries,
  init,
  update,
} from './definition'
import { view } from './view'

export const block = EducationComposition.toBlock({
  init: (today: CalendarDate, initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId)

    return {
      model: modifyFields(init(today, initialEntryId), {
        entries: () => [entryInit.model],
      }),
      commands: entryInit.commands,
    }
  },
  update,
  view,
  EffectsLayer,
})
