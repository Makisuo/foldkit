import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { primaryComposer, secondaryComposer } from './placements'

export const ChatDefinition = Block.define('Chat', { Model, Message })

export const RegisteredChatDefinition = ChatDefinition.register({
  children: [primaryComposer, secondaryComposer],
})
