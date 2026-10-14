import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { primaryComposer, secondaryComposer } from './placements'

export const ChatDefinition = Block.define('Chat', { Model, Message })

export const ChatComposition = ChatDefinition.toComposition({
  children: [primaryComposer, secondaryComposer],
})
