import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const Home = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})

export const HomeComposition = Home.toComposition()

export type ViewBuilder = Block.HtmlBuilderOf<typeof HomeComposition>
