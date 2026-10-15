import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { view } from './view'
import {
  EffectsLayer,
  WorkHistoryComposition,
  entries,
  init,
  update,
} from './workHistory'

export const block = WorkHistoryComposition.toBlock({
  init: (today: CalendarDate, initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId, today)

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
