import { Block } from 'foldkit'

import { Message } from './informingBlocksMessage'
import { Model } from './informingBlocksModel'

export const PeopleDefinition = Block.define('People', { Model, Message })
