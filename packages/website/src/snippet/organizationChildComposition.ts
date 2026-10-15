import type { Block } from 'foldkit'

import * as Counter from '../counter'
import { Dashboard } from './definition'
import { Message } from './message'

export const counter = Dashboard.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const DashboardComposition = Dashboard.toComposition({
  children: [counter],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof DashboardComposition>
