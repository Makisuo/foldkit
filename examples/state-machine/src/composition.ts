import type { Block } from 'foldkit'

import { RadioGroup } from '@foldkit/ui'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import {
  EDITION_RADIO_GROUP_ID,
  EditionRadioGroup,
  HARDCOVER_EDITION,
} from './model'
import { stepMachine } from './transition'

const foldEditionRadioGroupOutMessage = RadioGroup.OutMessage.match({
  Selected: ({ value }) =>
    stepMachine(
      Message.SelectedEdition({
        isShippingRequired: value === HARDCOVER_EDITION,
      }),
    ),
})

export const EditionRadioGroupBinding = ApplicationDefinition.bindChild(
  EditionRadioGroup,
  {
    field: 'editionRadioGroup',
    parentMessage: Message.GotEditionRadioGroupMessage,
    init: { startupToArgs: () => [{ id: EDITION_RADIO_GROUP_ID }] },
    outMessage: { fold: foldEditionRadioGroupOutMessage },
  },
)

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [EditionRadioGroupBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
