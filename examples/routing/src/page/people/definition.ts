import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const PeopleDefinition = Block.define('People', { Model, Message })
