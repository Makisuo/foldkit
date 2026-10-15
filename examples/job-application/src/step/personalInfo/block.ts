import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { EffectsLayer } from './command'
import {
  PersonalInfoComposition,
  availableDatePicker,
  pronounsListbox,
} from './composition'
import { PersonalInfo } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = PersonalInfoComposition.toBlock({
  init: PersonalInfo.init((today: CalendarDate) => {
    const pronounsInit = pronounsListbox.init({ id: 'pronouns' })
    const availableDateInit = availableDatePicker.init({
      id: 'available-date',
      today,
      minDate: today,
    })

    return {
      model: modifyFields(init(today), {
        pronouns: () => pronounsInit.model,
        availableDate: () => availableDateInit.model,
      }),
      commands: [
        ...(pronounsInit.commands ?? []),
        ...(availableDateInit.commands ?? []),
      ],
    }
  }),
  update,
  view,
  EffectsLayer,
})
