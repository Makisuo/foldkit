import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  PersonalInfoComposition,
  availableDatePicker,
  init,
  pronounsListbox,
  update,
} from './personalInfo'
import { view } from './view'

export const block = PersonalInfoComposition.toBlock({
  init: (today: CalendarDate) => {
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
  },
  update,
  view,
  EffectsLayer,
})
