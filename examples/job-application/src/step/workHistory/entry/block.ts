import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import {
  WorkHistoryEntryComposition,
  endDatePicker,
  startDatePicker,
} from './composition'
import { WorkHistoryEntry } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = WorkHistoryEntryComposition.toBlock({
  init: WorkHistoryEntry.init((entryId: string, today: CalendarDate) => {
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
  }),
  update,
  view,
})
