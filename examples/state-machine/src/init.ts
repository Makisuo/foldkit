import { RadioGroup } from '@foldkit/ui'

import { Application } from './definition'
import { checkoutMachine } from './machine'
import { EDITION_RADIO_GROUP_ID, Model } from './model'

export const initialModel = Model.make({
  checkout: checkoutMachine.initial,
  editionRadioGroup: RadioGroup.init({ id: EDITION_RADIO_GROUP_ID }),
  transitionLog: [],
  nextTransitionLogId: 0,
})

export const init = Application.init(() => ({
  model: initialModel,
}))
