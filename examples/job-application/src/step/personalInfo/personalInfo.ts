import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  RegisteredPersonalInfoDefinition,
  availableDatePicker,
  init,
  pronounsListbox,
  update,
} from './definition'
import { view } from './view'

export const block = RegisteredPersonalInfoDefinition.toBlock({
  init: (today: Parameters<typeof init>[0]) => {
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
