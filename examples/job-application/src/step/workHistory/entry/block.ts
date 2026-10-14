import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import {
  WorkHistoryEntryComposition,
  endDatePicker,
  init,
  startDatePicker,
  update,
} from './definition'
import { view } from './view'

export const block = WorkHistoryEntryComposition.toBlock({
  init: (entryId: string, today: CalendarDate) => {
    const startDateInit = startDatePicker.init({
      id: `${entryId}-start`,
      today,
    })
    const endDateInit = endDatePicker.init({ id: `${entryId}-end`, today })

    return {
      model: modifyFields(init(entryId, today), {
        startDate: () => startDateInit.model,
        endDate: () => endDateInit.model,
      }),
      commands: [
        ...(startDateInit.commands ?? []),
        ...(endDateInit.commands ?? []),
      ],
    }
  },
  update,
  view,
})
