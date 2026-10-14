import { editionRadioGroup } from './childBindings'
import { PlaceOrder } from './command'
import { ApplicationDefinition } from './definition'

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [editionRadioGroup],
})

export const EffectsLayer = PlaceOrder.layer
