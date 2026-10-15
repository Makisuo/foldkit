import { Block } from 'foldkit'
import type { HtmlBuilder } from 'foldkit/html'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const Home = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})

export type ViewBuilder = HtmlBuilder<Message>
