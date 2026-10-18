import { Block } from 'foldkit'

import { Message, OutMessage } from './message'
import { Model } from './model'

export const LoggedInDefinition = Block.define('LoggedIn', {
  Model,
  Message,
  OutMessage,
})
