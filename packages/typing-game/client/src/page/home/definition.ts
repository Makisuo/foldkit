import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const HomeDefinition = Block.define('Home', {
  Model,
  Message,
  OutMessage,
})
