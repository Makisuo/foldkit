import { RadioGroup } from '@foldkit/ui'

import { Application } from './definition'
import { Message } from './message'
import { EditionRadioGroup, HARDCOVER_EDITION } from './model'
import { stepMachine } from './transition'

const foldEditionRadioGroupOutMessage = RadioGroup.OutMessage.match({
  Selected: ({ value }) =>
    stepMachine(
      Message.SelectedEdition({
        isShippingRequired: value === HARDCOVER_EDITION,
      }),
    ),
})

export const editionRadioGroup = Application.bindChild(EditionRadioGroup, {
  field: 'editionRadioGroup',
  parentMessage: Message.GotEditionRadioGroupMessage,
  outMessage: { fold: foldEditionRadioGroupOutMessage },
})
