import type { Block } from 'foldkit'

import { editionRadioGroup } from './childBindings'
import { PlaceOrder } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition({
  children: [editionRadioGroup],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = PlaceOrder.layer
