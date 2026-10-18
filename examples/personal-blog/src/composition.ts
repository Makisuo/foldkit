import type { Block } from 'foldkit'

import { ApplicationDefinition } from './definition'
import { Counter } from './island'
import { Message } from './message'

export const CounterBinding = ApplicationDefinition.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [CounterBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
