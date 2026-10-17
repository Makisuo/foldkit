import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const SearchDefinition = Block.define('Search', {
  Model,
  Message,
})
