import { Block } from 'foldkit'

import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './bindings'
import { Message, OutMessage } from './message'
import { Model } from './model'

export const Home = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})

export const home = Home.register({
  children: [asyncCounterDemo, demoTabs, notePlayerDemo, playgroundMenu],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof home>
