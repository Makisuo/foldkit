import { Match } from 'effect'

import { ApplicationComposition, editionRadioGroup } from './composition'
import { stepMachine } from './transition'

export const update = ApplicationComposition.update((model, message) =>
  Match.value(message).pipe(
    Match.tag('GotEditionRadioGroupMessage', ({ message }) =>
      editionRadioGroup.fold(model, message),
    ),
    Match.tag(
      'ClickedContinue',
      'ClickedBack',
      'ClickedCancel',
      'ClickedPlaceOrder',
      'ClickedStartOver',
      'ToggledPaymentMethod',
      'SelectedEdition',
      'ToggledTermsAccepted',
      'UpdatedPromoCode',
      'SubmittedPromoCode',
      'CompletedPlaceOrder',
      () => stepMachine(message)(model),
    ),
    Match.exhaustive,
  ),
)
