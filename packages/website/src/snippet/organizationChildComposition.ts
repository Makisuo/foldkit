import * as Counter from '../counter'
import { DashboardDefinition } from './definition'
import { Message } from './message'

export const CounterBinding = DashboardDefinition.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const DashboardComposition = DashboardDefinition.makeComposition({
  childBindings: [CounterBinding],
})
