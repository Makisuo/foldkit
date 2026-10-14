import { editionRadioGroup } from './childBindings'
import { PlaceOrder } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition({
  children: [editionRadioGroup],
})

export const EffectsLayer = PlaceOrder.layer
