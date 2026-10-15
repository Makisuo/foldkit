import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { EffectsLayer } from './command'
import { WorkHistoryComposition, entries } from './composition'
import { WorkHistory } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = WorkHistoryComposition.toBlock({
  init: WorkHistory.init((today: CalendarDate, initialEntryId: string) => {
    const entryInit = entries.init(initialEntryId, initialEntryId, today)

    return {
      model: modifyFields(init(today, initialEntryId), {
        entries: () => [entryInit.model],
      }),
      commands: entryInit.commands,
    }
  }),
  update,
  view,
  EffectsLayer,
})
