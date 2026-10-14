import { Block } from 'foldkit'

import { dialog } from './connection'
import { Message } from './message'
import { Model } from './model'

export const SearchDefinition = Block.define('Search', {
  Model,
  Message,
}).register({
  children: [dialog],
})
