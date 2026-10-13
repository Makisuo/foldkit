import { Block } from 'foldkit'

import { dialog } from './bindings'
import { Message } from './message'
import { Model } from './model'

export const Search = Block.define('Search', {
  Model,
  Message,
})

export const search = Search.register({
  children: [dialog],
})
