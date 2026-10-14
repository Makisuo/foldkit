import { modifyFields } from 'foldkit/struct'

import {
  RegisteredWorkHistoryEntryDefinition,
  endDatePicker,
  init,
  startDatePicker,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredWorkHistoryEntryDefinition.toBlock({
  init: (
    entryId: Parameters<typeof init>[0],
    today: Parameters<typeof init>[1],
  ) => {
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
