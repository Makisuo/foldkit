import { modifyFields } from 'foldkit/struct'

import {
  EffectsLayer,
  availableDatePicker,
  init,
  personalInfo,
  pronounsListbox,
  update,
} from './block'
import { view } from './view'

export const block = personalInfo.assemble({
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
