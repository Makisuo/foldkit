import { Block } from 'foldkit'

import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './connection'
import { Message, OutMessage } from './message'
import { Model } from './model'

export const HomeDefinition = Block.define('Home', {
  Model,
  Message,
  OutMessage,
}).register({
  children: [asyncCounterDemo, demoTabs, notePlayerDemo, playgroundMenu],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof HomeDefinition>
